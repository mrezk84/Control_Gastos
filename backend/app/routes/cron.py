import hmac
import os

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models
from ..services.notify import format_money, notify, user_currency, user_today

router = APIRouter(tags=["Cron"])

DUE_SOON_DAYS = 3


def _require_cron_secret(authorization: str | None = Header(default=None)):
    secret = os.getenv("CRON_SECRET", "")
    if not secret:  # nunca queda abierto por olvidar la variable
        raise HTTPException(status_code=503, detail="CRON_SECRET no está configurado")
    expected = f"Bearer {secret}"
    if not authorization or not hmac.compare_digest(authorization.encode(), expected.encode()):
        raise HTTPException(status_code=401, detail="No autorizado")


def _kind_and_title(days_left: int) -> tuple[str, str] | None:
    if days_left < 0:
        return "overdue", "Pago vencido"
    if days_left == 0:
        return "due_today", "Vence hoy"
    if days_left <= DUE_SOON_DAYS:
        return "due_soon", f"Vence en {days_left} día{'s' if days_left != 1 else ''}"
    return None


@router.get("/reminders", dependencies=[Depends(_require_cron_secret)])
def run_reminders(db: Session = Depends(get_db)):
    """Avisa de los recordatorios por vencer, que vencen hoy o vencidos. Se puede ejecutar varias veces al día.

    «Hoy» se calcula con la zona horaria de cada persona. Un mismo tipo no se repite el mismo día, y
    «vencido» se avisa una sola vez.
    """
    rows = (
        db.query(models.PaymentReminder, models.User)
        .join(models.User, models.User.id == models.PaymentReminder.user_id)
        .filter(models.PaymentReminder.status == "pending")
        .all()
    )
    notified = 0
    for reminder, user in rows:
        today = user_today(user)
        found = _kind_and_title((reminder.due_date - today).days)
        if not found:
            continue
        kind, title = found
        if reminder.last_notified_kind == "overdue":
            continue
        if reminder.last_notified_kind == kind and reminder.last_notified_on == today:
            continue
        body = f"{reminder.description} · {format_money(reminder.amount, user_currency(user))}"
        reminder.last_notified_kind, reminder.last_notified_on = kind, today
        db.commit()  # primero se marca: si el envío falla, no se repite a cada ejecución
        notify(db, user.id, kind, title, body, link="/")
        notified += 1
    return {"checked": len(rows), "notified": notified}
