from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from .. import schemas, models
from ..auth.utils import get_current_user
from ..services.notify import user_today

router = APIRouter(tags=["Reminders"])

_SOURCES = {"ocr", "qr", "manual"}
_EDITABLE_STATUS = {"pending", "dismissed"}


def _own(db: Session, reminder_id: int, user: models.User) -> models.PaymentReminder:
    r = db.query(models.PaymentReminder).filter(
        models.PaymentReminder.id == reminder_id, models.PaymentReminder.user_id == user.id
    ).first()
    if not r:
        raise HTTPException(status_code=404, detail="Recordatorio no encontrado")
    return r


@router.get("/", response_model=list[schemas.Reminder])
def list_reminders(
    status_: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.PaymentReminder).filter(models.PaymentReminder.user_id == current_user.id)
    if status_:
        q = q.filter(models.PaymentReminder.status == status_)
    return q.order_by(models.PaymentReminder.due_date, models.PaymentReminder.id).all()


@router.post("/", response_model=schemas.Reminder, status_code=status.HTTP_201_CREATED)
def create_reminder(
    payload: schemas.ReminderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if payload.amount <= 0:
        raise HTTPException(status_code=422, detail="El monto debe ser mayor a 0")
    if not payload.description.strip():
        raise HTTPException(status_code=422, detail="La descripción es obligatoria")
    if payload.source not in _SOURCES:
        raise HTTPException(status_code=422, detail="Origen inválido")
    r = models.PaymentReminder(
        user_id=current_user.id, description=payload.description.strip(), amount=payload.amount,
        category=payload.category, due_date=payload.due_date, source=payload.source, status="pending",
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


@router.put("/{reminder_id}", response_model=schemas.Reminder)
def update_reminder(
    reminder_id: int,
    payload: schemas.ReminderUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    r = _own(db, reminder_id, current_user)
    data = payload.model_dump(exclude_unset=True)
    if "status" in data:
        if data["status"] not in _EDITABLE_STATUS or r.status == "paid":
            raise HTTPException(status_code=422, detail="Estado inválido (para pagar usa /reminders/{id}/pay)")
    if "amount" in data and (data["amount"] is None or data["amount"] <= 0):
        raise HTTPException(status_code=422, detail="El monto debe ser mayor a 0")
    for key, value in data.items():
        if value is not None:
            setattr(r, key, value)
    if "due_date" in data:  # una nueva fecha vuelve a habilitar los avisos
        r.last_notified_kind = None
        r.last_notified_on = None
    db.commit()
    db.refresh(r)
    return r


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db.delete(_own(db, reminder_id, current_user))
    db.commit()


@router.post("/{reminder_id}/pay", response_model=schemas.Reminder)
def pay_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Crea el gasto (fecha de hoy en el huso de la persona) y marca el recordatorio como pagado."""
    r = _own(db, reminder_id, current_user)
    if r.status == "paid":
        raise HTTPException(status_code=409, detail="El recordatorio ya está pagado")
    expense = models.Expense(
        description=r.description, amount=r.amount, category=r.category or "Otros",
        date=user_today(current_user), user_id=current_user.id,
    )
    db.add(expense)
    db.flush()
    r.expense_id = expense.id
    r.status = "paid"
    db.commit()
    db.refresh(r)
    return r
