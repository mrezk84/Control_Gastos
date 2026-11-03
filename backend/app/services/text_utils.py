"""Utilidades compartidas para leer montos y fechas de textos de facturas, QR y OCR."""
import re
from datetime import date
from typing import Optional

_DATE_RE = r"(\d{1,4})[/\-.](\d{1,2})[/\-.](\d{1,4})"
_DUE_KEYWORDS = r"(?:vencimiento|vence|vto\.?|due\s*date|expires?|expiry|pagar\s+antes\s+del)"


def parse_amount(raw: str) -> Optional[float]:
    """Convierte '1.234,56', '1,234.56', '1234.56' o '58.000' en float. None si no es un número."""
    s = re.sub(r"[^\d.,]", "", str(raw))
    if not s or not re.search(r"\d", s):
        return None
    last_dot, last_comma = s.rfind("."), s.rfind(",")
    if last_dot != -1 and last_comma != -1:
        # El separador que aparece último es el decimal
        dec, mil = ("." if last_dot > last_comma else ","), ("," if last_dot > last_comma else ".")
        s = s.replace(mil, "").replace(dec, ".")
    elif last_comma != -1 or last_dot != -1:
        sep = "," if last_comma != -1 else "."
        parts = s.split(sep)
        # '58.000' o '1.234.567' → miles; '12,50' → decimal
        if len(parts) > 2 or (len(parts) == 2 and len(parts[1]) == 3 and len(parts[0]) <= 3 and parts[0] != "0"):
            s = s.replace(sep, "")
        else:
            s = s.replace(sep, ".")
    try:
        return float(s)
    except ValueError:
        return None


def parse_date(raw: str, dayfirst: bool = True) -> Optional[str]:
    """Devuelve la fecha en ISO (aaaa-mm-dd) o None. Acepta aaaa-mm-dd y dd/mm/aaaa (o mm/dd/aaaa)."""
    m = re.search(_DATE_RE, str(raw))
    if not m:
        return None
    a, b, c = m.groups()
    try:
        if len(a) == 4:
            y, mo, d = int(a), int(b), int(c)
        elif len(c) in (2, 4):
            y = int(c) + (2000 if len(c) == 2 else 0)
            d, mo = (int(a), int(b)) if dayfirst else (int(b), int(a))
        else:
            return None
        return date(y, mo, d).isoformat()
    except ValueError:
        return None


def extract_due_date(text: str, dayfirst: bool = True) -> Optional[str]:
    """Busca una fecha cerca de palabras como 'vencimiento', 'vence', 'vto.', 'due date'."""
    m = re.search(_DUE_KEYWORDS + r"[^\d\n]{0,25}(" + _DATE_RE + ")", text, re.IGNORECASE)
    return parse_date(m.group(1), dayfirst) if m else None
