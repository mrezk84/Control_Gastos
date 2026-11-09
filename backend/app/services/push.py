"""Web Push (notificaciones del navegador) con claves VAPID.

Sin VAPID_PRIVATE_KEY / VAPID_PUBLIC_KEY el envío se omite: las notificaciones siguen guardándose en la app.
"""
import ipaddress
import json
import logging
import os
import socket
from typing import Optional
from urllib.parse import urlsplit

import requests
from pywebpush import WebPushException, webpush
from sqlalchemy.orm import Session

from .. import models

logger = logging.getLogger(__name__)

# El endpoint de una suscripción lo escribe el cliente, y el servidor le hace un POST: sin restricción
# sería una vía para pedir al servidor que contacte destinos internos (SSRF). Solo se aceptan los
# servicios push de los navegadores, siempre por HTTPS y sin redirecciones.
ALLOWED_PUSH_HOSTS = frozenset({
    "fcm.googleapis.com",                # Chrome, Edge, Opera, Brave, Android
    "updates.push.services.mozilla.com",  # Firefox
    "web.push.apple.com",                # Safari
})
ALLOWED_PUSH_SUFFIXES = (
    ".push.services.mozilla.com",
    ".notify.windows.com",               # Edge heredado / WNS
    ".push.apple.com",
)
MAX_ENDPOINT_LENGTH = 1000
MAX_SUBSCRIPTIONS_PER_USER = 10
PUSH_TIMEOUT_SECONDS = 10


def _extra_allowed_hosts() -> tuple[set[str], tuple[str, ...]]:
    """PUSH_ALLOWED_HOSTS añade hosts: «host.exacto» o «.sufijo» separados por comas."""
    exact, suffixes = set(), []
    for item in (os.getenv("PUSH_ALLOWED_HOSTS") or "").split(","):
        item = item.strip().lower()
        if item.startswith("."):
            suffixes.append(item)
        elif item:
            exact.add(item)
    return exact, tuple(suffixes)


def is_allowed_push_endpoint(endpoint: str) -> bool:
    """HTTPS, puerto 443, host de la lista (no una IP), sin credenciales en la URL."""
    if not endpoint or len(endpoint) > MAX_ENDPOINT_LENGTH:
        return False
    try:
        parts = urlsplit(endpoint)
        host = (parts.hostname or "").lower().rstrip(".")
        port = parts.port
    except ValueError:
        return False
    if parts.scheme != "https" or not host or parts.username or parts.password or port not in (None, 443):
        return False
    try:
        ipaddress.ip_address(host)
        return False  # un literal de IP nunca es un servicio push
    except ValueError:
        pass
    extra_exact, extra_suffixes = _extra_allowed_hosts()
    return (
        host in ALLOWED_PUSH_HOSTS or host in extra_exact
        or host.endswith(ALLOWED_PUSH_SUFFIXES) or host.endswith(extra_suffixes)
    )


def _resolve(host: str) -> list[str]:
    return [info[4][0] for info in socket.getaddrinfo(host, 443, proto=socket.IPPROTO_TCP)]


def resolves_to_public_addresses(host: str) -> bool:
    """Defensa en profundidad contra un DNS que apunte a una dirección interna: todas deben ser públicas."""
    try:
        addresses = _resolve(host)
        return bool(addresses) and all(ipaddress.ip_address(a).is_global for a in addresses)
    except (OSError, ValueError):
        return False


class _NoRedirectSession(requests.Session):
    """Sesión que no sigue redirecciones: un servicio push comprometido no puede reenviarnos a un destino interno."""

    def request(self, *args, **kwargs):  # type: ignore[override]
        kwargs["allow_redirects"] = False
        return super().request(*args, **kwargs)


def vapid_public_key() -> Optional[str]:
    return os.getenv("VAPID_PUBLIC_KEY") or None


def push_enabled() -> bool:
    return bool(os.getenv("VAPID_PRIVATE_KEY") and vapid_public_key())


def send_push(db: Session, user_id: int, title: str, body: str, link: Optional[str] = None) -> int:
    """Envía la notificación a todas las suscripciones de la persona. Devuelve cuántas se entregaron.

    Si el servicio de push responde 404 o 410 la suscripción ya no existe y se borra.
    """
    if not push_enabled():
        return 0
    subs = db.query(models.PushSubscription).filter(models.PushSubscription.user_id == user_id).all()
    payload = json.dumps({"title": title, "body": body, "link": link or "/"})
    claims = {"sub": os.getenv("VAPID_SUBJECT", "mailto:admin@example.com")}
    delivered = 0
    session = _NoRedirectSession()
    for sub in subs:
        host = (urlsplit(sub.endpoint).hostname or "").lower()
        if not is_allowed_push_endpoint(sub.endpoint) or not resolves_to_public_addresses(host):
            # Suscripción guardada antes de la validación (o con un DNS sospechoso): no se contacta y se elimina
            logger.warning("Suscripción push descartada por endpoint no permitido: id=%s", sub.id)
            db.delete(sub)
            continue
        try:
            webpush(
                subscription_info={"endpoint": sub.endpoint, "keys": {"p256dh": sub.p256dh, "auth": sub.auth}},
                data=payload,
                vapid_private_key=os.getenv("VAPID_PRIVATE_KEY"),
                vapid_claims=dict(claims),
                ttl=86400,
                timeout=PUSH_TIMEOUT_SECONDS,
                requests_session=session,
            )
            delivered += 1
        except WebPushException as e:
            status = getattr(getattr(e, "response", None), "status_code", None)
            if status in (404, 410):
                db.delete(sub)
            else:
                logger.warning("Fallo al enviar push a la suscripción %s: %s", sub.id, e)
        except Exception as e:  # una suscripción defectuosa no debe impedir las demás
            logger.warning("Error inesperado al enviar push a la suscripción %s: %s", sub.id, e)
    db.commit()
    return delivered
