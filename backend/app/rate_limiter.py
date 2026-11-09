"""
Limitación de intentos compartida entre instancias.

Los contadores viven en la tabla `rate_limit_hits` (la base de datos ya es compartida por todas las
instancias serverless; un diccionario en memoria no lo es). Cada intento se REGISTRA primero y se
cuenta después, así una ráfaga paralela no puede colarse entre la comprobación y el registro.

La IP del cliente solo se toma de cabeceras de proxy cuando la infraestructura las garantiza:
- en Vercel (variable VERCEL) la plataforma sobrescribe `x-vercel-forwarded-for` / `x-forwarded-for`;
- en cualquier otro proxy propio, activa TRUST_PROXY_HEADERS=1 y se usa la ÚLTIMA entrada de
  `X-Forwarded-For` (la que añadió el proxy más cercano, no la que escribió el cliente).
Sin ninguna de las dos se usa la dirección de la conexión.
"""

import os
import random
from datetime import datetime, timedelta
from typing import Iterable

from fastapi import HTTPException, Request, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from . import models

_MAX_KEY = 255


def client_ip(request: Request) -> str:
    if os.getenv("VERCEL"):
        forwarded = request.headers.get("x-vercel-forwarded-for") or request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
    elif os.getenv("TRUST_PROXY_HEADERS", "").lower() in ("1", "true", "yes"):
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[-1].strip()
    return request.client.host if request.client else "desconocida"


def _key(*parts: object) -> str:
    return ":".join(str(p).strip().lower() for p in parts)[:_MAX_KEY]


def _prune(db: Session) -> None:
    """Borra intentos de más de un día; se ejecuta de vez en cuando para no engordar la tabla."""
    if random.random() < 0.02:
        db.query(models.RateLimitHit).filter(
            models.RateLimitHit.created_at < datetime.utcnow() - timedelta(days=1)
        ).delete(synchronize_session=False)
        db.commit()


def hit(db: Session, scope: str, identifier: object, limit: int, window_seconds: int) -> None:
    """Registra un intento de `identifier` en `scope` y lanza 429 si supera `limit` en la ventana."""
    hit_many(db, [(scope, identifier, limit, window_seconds)])


def hit_many(db: Session, rules: Iterable[tuple[str, object, int, int]]) -> None:
    """Como `hit`, para varias reglas a la vez (p. ej. por cuenta y por IP). Registra todas y evalúa todas."""
    now = datetime.utcnow()
    prepared = [(_key(scope, ident), limit, window) for scope, ident, limit, window in rules]
    db.add_all([models.RateLimitHit(key=k, created_at=now) for k, _, _ in prepared])
    db.commit()

    worst_wait = 0
    for k, limit, window in prepared:
        since = now - timedelta(seconds=window)
        count, oldest = db.query(func.count(models.RateLimitHit.id), func.min(models.RateLimitHit.created_at)).filter(
            models.RateLimitHit.key == k, models.RateLimitHit.created_at > since
        ).one()
        if count > limit:
            wait = max(1, int(window - (now - oldest).total_seconds()))
            worst_wait = max(worst_wait, wait)
    _prune(db)
    if worst_wait:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Demasiados intentos. Espera unos minutos antes de volver a probar.",
            headers={"Retry-After": str(worst_wait)},
        )


def clear(db: Session, scope: str, identifier: object) -> None:
    """Olvida los intentos de `identifier` en `scope` (p. ej. tras un inicio de sesión correcto)."""
    db.query(models.RateLimitHit).filter(models.RateLimitHit.key == _key(scope, identifier)).delete(
        synchronize_session=False
    )
    db.commit()
