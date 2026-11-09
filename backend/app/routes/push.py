from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models
from ..auth.utils import get_current_user
from ..services.push import MAX_SUBSCRIPTIONS_PER_USER, is_allowed_push_endpoint, vapid_public_key

router = APIRouter(tags=["Push"])


class PushKeys(BaseModel):
    p256dh: str = Field(..., max_length=255)
    auth: str = Field(..., max_length=255)


class PushSubscribeRequest(BaseModel):
    """Forma de PushSubscription.toJSON() en el navegador."""
    endpoint: str
    keys: PushKeys


class PushUnsubscribeRequest(BaseModel):
    endpoint: str


@router.get("/vapid-key")
def get_vapid_key():
    """Clave pública que el navegador necesita para suscribirse (pública, sin sesión)."""
    key = vapid_public_key()
    if not key:
        raise HTTPException(status_code=503, detail="Las notificaciones del navegador no están configuradas")
    return {"public_key": key}


@router.post("/subscribe", status_code=201)
def subscribe(
    payload: PushSubscribeRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not is_allowed_push_endpoint(payload.endpoint):
        raise HTTPException(status_code=422, detail="Suscripción inválida")
    sub = db.query(models.PushSubscription).filter(models.PushSubscription.endpoint == payload.endpoint).first()
    if sub:  # el mismo navegador cambió de cuenta, o renovó las claves
        sub.user_id, sub.p256dh, sub.auth = current_user.id, payload.keys.p256dh, payload.keys.auth
    else:
        db.add(models.PushSubscription(
            user_id=current_user.id, endpoint=payload.endpoint,
            p256dh=payload.keys.p256dh, auth=payload.keys.auth,
        ))
        db.flush()
        # Tope por persona: al pasarlo se descartan las más antiguas
        ids = [row.id for row in db.query(models.PushSubscription.id).filter(
            models.PushSubscription.user_id == current_user.id
        ).order_by(models.PushSubscription.id.desc()).all()]
        if len(ids) > MAX_SUBSCRIPTIONS_PER_USER:
            db.query(models.PushSubscription).filter(
                models.PushSubscription.id.in_(ids[MAX_SUBSCRIPTIONS_PER_USER:])
            ).delete(synchronize_session=False)
    db.commit()
    return {"subscribed": True}


@router.delete("/subscribe", status_code=204)
def unsubscribe(
    payload: PushUnsubscribeRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db.query(models.PushSubscription).filter(
        models.PushSubscription.endpoint == payload.endpoint,
        models.PushSubscription.user_id == current_user.id,
    ).delete()
    db.commit()
