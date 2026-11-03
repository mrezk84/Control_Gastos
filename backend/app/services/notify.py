"""Notificaciones dentro de la app y utilidades de perfil (moneda, huso horario).

El envío de Web Push se añade en el PR siguiente: notify() ya es el único punto por donde pasan los avisos.
"""
from datetime import date, datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from .. import models

DEFAULT_CURRENCY = "UYU"
DEFAULT_TIMEZONE = "America/Montevideo"

_SYMBOLS = {"UYU": "$", "ARS": "$", "CLP": "$", "COP": "$", "MXN": "$", "USD": "US$", "EUR": "€", "GBP": "£",
            "BRL": "R$", "PEN": "S/"}


def user_currency(user: models.User) -> str:
    return user.currency or DEFAULT_CURRENCY


def user_timezone(user: models.User) -> str:
    return user.timezone or DEFAULT_TIMEZONE


def user_today(user: models.User) -> date:
    """La fecha de hoy en la zona horaria de la persona."""
    try:
        tz = ZoneInfo(user_timezone(user))
    except (ZoneInfoNotFoundError, ValueError):
        tz = ZoneInfo(DEFAULT_TIMEZONE)
    return datetime.now(tz).date()


def format_money(amount: float, currency: str) -> str:
    """'$58.000', 'US$1.250,50', 'CHF 90'. Miles con punto y decimales con coma, solo si hacen falta."""
    if abs(amount - round(amount)) < 0.005:
        text = f"{round(amount):,}".replace(",", ".")
    else:
        text = f"{amount:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    symbol = _SYMBOLS.get(currency)
    return f"{symbol}{text}" if symbol else f"{currency} {text}"


def month_total(db: Session, user_id: int, ref: date) -> float:
    total = db.query(func.coalesce(func.sum(models.Expense.amount), 0.0)).filter(
        models.Expense.user_id == user_id,
        extract("year", models.Expense.date) == ref.year,
        extract("month", models.Expense.date) == ref.month,
    ).scalar()
    return float(total or 0)


def notify(db: Session, user_id: int, kind: str, title: str, body: str, link: str | None = None) -> models.Notification:
    n = models.Notification(user_id=user_id, kind=kind, title=title, body=body, link=link)
    db.add(n)
    db.commit()
    db.refresh(n)
    return n
