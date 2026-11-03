from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from .. import schemas, models
from ..auth.utils import get_current_user

router = APIRouter(tags=["Notifications"])


@router.get("/", response_model=schemas.NotificationList)
def list_notifications(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    base = db.query(models.Notification).filter(models.Notification.user_id == current_user.id)
    unread = base.filter(models.Notification.read_at.is_(None)).count()
    items = base.order_by(models.Notification.created_at.desc(), models.Notification.id.desc()).limit(limit).all()
    return schemas.NotificationList(unread_count=unread, notifications=items)


@router.post("/read-all", status_code=204)
def read_all(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id, models.Notification.read_at.is_(None)
    ).update({"read_at": datetime.utcnow()})
    db.commit()


@router.post("/{notification_id}/read", response_model=schemas.Notification)
def read_one(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    n = db.query(models.Notification).filter(
        models.Notification.id == notification_id, models.Notification.user_id == current_user.id
    ).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    if n.read_at is None:
        n.read_at = datetime.utcnow()
        db.commit()
        db.refresh(n)
    return n
