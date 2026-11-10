"""Gastos hormiga: umbral adaptativo, detección de patrones y avisos.

Una compra "hormiga" es una compra chica y repetida. El umbral por defecto se adapta a cada persona
(el 30 % de sus compras más baratas de los últimos 90 días) para no depender de un monto fijo que no
significa lo mismo en cada moneda ni en cada bolsillo; la persona puede fijarlo a mano.

Los avisos se disparan al registrar un gasto y nunca rompen ese registro. Tono sin culpa. Límite de
frecuencia: un aviso hormiga por día y dos por semana.
"""
import json
import unicodedata
from datetime import date, datetime, timedelta

from sqlalchemy import func, extract
from sqlalchemy.orm import Session

from .. import models
from .notify import format_money, user_currency, user_today, notify

DEFAULT_THRESHOLD = 300.0   # mientras hay pocos datos para adaptarse
MIN_SAMPLE = 15             # compras mínimas para que el umbral automático se adapte
LOOKBACK_DAYS = 90
ADAPTIVE_PERCENTILE = 0.30
REPEAT_MIN = 3              # misma compra, esta cantidad de veces...
REPEAT_WINDOW_DAYS = 14     # ...en esta ventana
WARN_PCT = 80               # aviso al llegar a este % del tope
MAX_PER_DAY = 1
MAX_PER_WEEK = 2
KINDS = ("ant_repeat", "ant_limit")


def normalize(text: str | None) -> str:
    """'  Café ' → 'cafe': sin tildes, minúsculas y espacios recortados."""
    base = unicodedata.normalize("NFD", (text or "").strip().lower())
    return "".join(c for c in base if unicodedata.category(c) != "Mn")


def excluded_set(user: models.User) -> set[str]:
    try:
        return {normalize(x) for x in json.loads(user.ant_excluded or "[]")}
    except (ValueError, TypeError):
        return set()


def _percentile(sorted_values: list[float], q: float) -> float:
    if not sorted_values:
        return 0.0
    idx = (len(sorted_values) - 1) * q
    lo, hi = int(idx), min(int(idx) + 1, len(sorted_values) - 1)
    return sorted_values[lo] + (sorted_values[hi] - sorted_values[lo]) * (idx - lo)


def adaptive_threshold(amounts: list[float]) -> float:
    """Percentil 30 de las compras de la persona, redondeado a un número "limpio"; con pocos datos, el de por defecto."""
    values = sorted(a for a in amounts if a and a > 0)
    if len(values) < MIN_SAMPLE:
        return DEFAULT_THRESHOLD
    raw = _percentile(values, ADAPTIVE_PERCENTILE)
    step = 5 if raw >= 50 else 1
    return float(max(1, round(raw / step) * step))


def effective_threshold(db: Session, user: models.User, today: date | None = None) -> tuple[float, str, int]:
    """(umbral, modo, compras usadas) con modo 'manual' o 'auto'."""
    if user.ant_threshold and user.ant_threshold > 0:
        return float(user.ant_threshold), "manual", 0
    since = (today or user_today(user)) - timedelta(days=LOOKBACK_DAYS)
    rows = db.query(models.Expense.amount).filter(
        models.Expense.user_id == user.id, models.Expense.date >= since
    ).all()
    amounts = [r[0] for r in rows]
    return adaptive_threshold(amounts), "auto", len(amounts)


def month_small_total(db: Session, user: models.User, ref: date, threshold: float, excluded: set[str],
                      exclude_expense_id: int | None = None) -> float:
    rows = db.query(models.Expense).filter(
        models.Expense.user_id == user.id,
        extract("year", models.Expense.date) == ref.year,
        extract("month", models.Expense.date) == ref.month,
        models.Expense.amount < threshold,
        models.Expense.amount > 0,
    ).all()
    return round(sum(e.amount for e in rows
                     if e.id != exclude_expense_id and normalize(e.description) not in excluded), 2)


def repeat_count(db: Session, user: models.User, expense: models.Expense, threshold: float,
                 today: date | None = None) -> tuple[int, float]:
    """Cuántas veces (y cuánto suma) se repitió la descripción de `expense` en los últimos REPEAT_WINDOW_DAYS días.

    La ventana se mide hacia atrás desde hoy, no desde la fecha del gasto: así un gasto cargado con fecha
    pasada cuenta igual que los demás. Un gasto más viejo que la ventana no cuenta (devuelve 0).
    """
    since = (today or user_today(user)) - timedelta(days=REPEAT_WINDOW_DAYS)
    if expense.date < since:
        return 0, 0.0
    key = normalize(expense.description)
    rows = db.query(models.Expense).filter(
        models.Expense.user_id == user.id,
        models.Expense.date >= since,
        models.Expense.amount < threshold,
        models.Expense.amount > 0,
    ).all()
    same = [e for e in rows if normalize(e.description) == key]
    return len(same), round(sum(e.amount for e in same), 2)


def recent_ant_notifications(db: Session, user: models.User, now: datetime | None = None) -> tuple[int, int]:
    """(avisos hormiga en las últimas 24 h, en los últimos 7 días)."""
    now = now or datetime.utcnow()
    base = db.query(func.count(models.Notification.id)).filter(
        models.Notification.user_id == user.id, models.Notification.kind.in_(KINDS))
    day = base.filter(models.Notification.created_at >= now - timedelta(days=1)).scalar() or 0
    week = base.filter(models.Notification.created_at >= now - timedelta(days=7)).scalar() or 0
    return day, week


def should_notify_repeat(count: int) -> bool:
    """Al llegar a REPEAT_MIN y luego cada 5 repeticiones (3, 5, 10, 15…), para no insistir."""
    return count == REPEAT_MIN or (count > REPEAT_MIN and count % 5 == 0)


def candidate_alert(db: Session, user: models.User, expense: models.Expense) -> tuple[str, str, str] | None:
    """El aviso que corresponde tras registrar `expense`, o None. Devuelve (tipo, título, texto)."""
    if not user.ant_notify:
        return None
    threshold, _, _ = effective_threshold(db, user)
    excluded = excluded_set(user)
    if not (0 < expense.amount < threshold) or normalize(expense.description) in excluded:
        return None
    money = lambda n: format_money(n, user_currency(user))  # noqa: E731

    # 1) Tope del mes: se cruza el 80 % o el 100 %
    if user.ant_limit and user.ant_limit > 0:
        before = month_small_total(db, user, expense.date, threshold, excluded, exclude_expense_id=expense.id)
        after = round(before + expense.amount, 2)
        limit = user.ant_limit
        if before < limit <= after:
            return ("ant_limit", "Llegaste al tope de compras chicas",
                    f"Ya sumas {money(after)} de {money(limit)} este mes. Nada grave: solo para que lo sepas.")
        if before < limit * WARN_PCT / 100 <= after:
            return ("ant_limit", f"Vas por el {WARN_PCT} % de tu tope",
                    f"Llevas {money(after)} de {money(limit)} en compras chicas este mes.")

    # 2) Misma compra repetida
    count, total = repeat_count(db, user, expense, threshold)
    if should_notify_repeat(count):
        name = (expense.description or "esta compra").strip()
        return ("ant_repeat", f"{name}: {count} veces en {REPEAT_WINDOW_DAYS} días",
                f"Suman {money(total)}. Cada una parece poco, pero juntas pesan. Nada grave.")
    return None


def maybe_notify(db: Session, user: models.User, expense: models.Expense) -> models.Notification | None:
    """Avisa si hay un patrón y no se superó el límite de frecuencia. Nunca lanza: no debe romper el registro."""
    try:
        alert = candidate_alert(db, user, expense)
        if not alert:
            return None
        day, week = recent_ant_notifications(db, user)
        if day >= MAX_PER_DAY or week >= MAX_PER_WEEK:
            return None
        kind, title, body = alert
        return notify(db, user.id, kind, title, body, link="/hormiga")
    except Exception:  # noqa: BLE001
        db.rollback()
        return None
