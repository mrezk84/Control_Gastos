"""Web Push (notificaciones del navegador) con claves VAPID.

Sin VAPID_PRIVATE_KEY / VAPID_PUBLIC_KEY el envío se omite: las notificaciones siguen guardándose en la app.
"""
import json
import logging
import os
from typing import Optional

from pywebpush import WebPushException, webpush
from sqlalchemy.orm import Session

from .. import models

logger = logging.getLogger(__name__)


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
    for sub in subs:
        try:
            webpush(
                subscription_info={"endpoint": sub.endpoint, "keys": {"p256dh": sub.p256dh, "auth": sub.auth}},
                data=payload,
                vapid_private_key=os.getenv("VAPID_PRIVATE_KEY"),
                vapid_claims=dict(claims),
                ttl=86400,
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
