"""Lectura del texto de un QR de factura o pago, para cualquier país.

Orden: adaptadores por país → EMVCo (estándar internacional) → URL con parámetros → texto libre.
Devuelve el primer resultado con monto, con la misma forma que el OCR más `currency`, `due_date` y `source`.
"""
import re
from typing import Any, Dict, Optional
from urllib.parse import parse_qs, urlparse

from .ocr_service import OCRService
from .qr_countries import ADAPTERS
from .text_utils import extract_due_date, parse_amount, parse_date

# ISO 4217 numérico → alfabético (EMVCo tag 53)
CURRENCIES = {
    "032": "ARS", "036": "AUD", "076": "BRL", "124": "CAD", "152": "CLP", "170": "COP", "188": "CRC",
    "214": "DOP", "356": "INR", "484": "MXN", "558": "NIO", "590": "PAB", "600": "PYG", "604": "PEN",
    "826": "GBP", "840": "USD", "858": "UYU", "862": "VES", "937": "VES", "946": "RON", "978": "EUR",
    "068": "BOB", "320": "GTQ", "340": "HNL",
}

_AMOUNT_KEYS = ("importe", "monto", "total", "amount", "valor", "value", "montototal")
_DATE_KEYS = ("fecha", "fechaemision", "date", "emision", "issued")
_DUE_KEYS = ("vencimiento", "vto", "due", "duedate", "fechavencimiento")
_MERCHANT_KEYS = ("comercio", "merchant", "emisor", "nombre", "name", "razonsocial")
_CURRENCY_KEYS = ("moneda", "currency")


def parse_emvco(text: str) -> Optional[Dict[str, Any]]:
    """TLV de EMVCo: tag(2) + longitud(2) + valor. Tags: 53 moneda, 54 monto, 59 comercio."""
    t = text.strip()
    if not t.startswith("000201"):
        return None
    fields: Dict[str, str] = {}
    i = 0
    while i + 4 <= len(t):
        tag, length = t[i:i + 2], t[i + 2:i + 4]
        if not length.isdigit():
            return None
        end = i + 4 + int(length)
        if end > len(t):
            return None
        fields[tag] = t[i + 4:end]
        i = end
    amount = parse_amount(fields.get("54", ""))
    if amount is None or amount <= 0:
        return None
    merchant = fields.get("59") or None
    return {
        "amount": amount,
        "date": None,
        "merchant": merchant,
        "description": f"Pago a {merchant}" if merchant else "Pago por QR",
        "currency": CURRENCIES.get(fields.get("53", "")),
    }


def parse_url_params(text: str) -> Optional[Dict[str, Any]]:
    url = text.strip()
    if not re.match(r"https?://", url, re.IGNORECASE):
        return None
    q = {k.lower().replace("_", "").replace("-", ""): v[0] for k, v in parse_qs(urlparse(url).query).items() if v}
    pick = lambda keys: next((q[k] for k in keys if q.get(k)), None)  # noqa: E731
    amount = parse_amount(pick(_AMOUNT_KEYS) or "")
    if amount is None or amount <= 0:
        return None
    merchant = pick(_MERCHANT_KEYS)
    return {
        "amount": amount,
        "date": parse_date(pick(_DATE_KEYS) or ""),
        "due_date": parse_date(pick(_DUE_KEYS) or ""),
        "merchant": merchant,
        "description": f"Compra en {merchant}" if merchant else "Compra por QR",
        "currency": (pick(_CURRENCY_KEYS) or "").upper() or None,
    }


def parse_free_text(text: str) -> Optional[Dict[str, Any]]:
    base = OCRService._parse_receipt_text(text)
    if not base.get("amount"):
        return None
    return {k: base.get(k) for k in ("amount", "date", "merchant", "description", "due_date")} | {"currency": None}


def parse_qr(text: str) -> Optional[Dict[str, Any]]:
    """Devuelve el resultado normalizado, o None si ningún lector encuentra un monto."""
    text = (text or "").strip()
    if not text:
        return None
    readers = [(f"country:{m.__name__.rsplit('.', 1)[-1]}", m.parse) for m in ADAPTERS if m.matches(text)]
    readers += [("emvco", parse_emvco), ("url", parse_url_params), ("text", parse_free_text)]
    for source, reader in readers:
        try:
            result = reader(text)
        except Exception:  # un lector defectuoso no debe tumbar a los demás
            result = None
        if result and result.get("amount"):
            result.setdefault("due_date", None)
            result["due_date"] = result["due_date"] or extract_due_date(text)
            result["source"] = source
            result["raw_text"] = text
            return result
    return None
