"""Argentina: factura electrónica de AFIP/ARCA.

URL: https://www.afip.gob.ar/fe/qr/?p=<base64 de un JSON con importe, fecha, cuit, ptoVta, tipoCmp, nroCmp, moneda>
Formato NO verificado contra un QR real: se lee de forma tolerante (ver docs/specs/recordatorios.md).
"""
import base64
import json
import re
from typing import Any, Dict, Optional
from urllib.parse import parse_qs, urlparse

from ..text_utils import parse_amount, parse_date

TIPOS = {1: "Factura A", 2: "Nota de débito A", 3: "Nota de crédito A", 6: "Factura B", 7: "Nota de débito B",
         8: "Nota de crédito B", 11: "Factura C", 12: "Nota de débito C", 13: "Nota de crédito C"}
MONEDAS = {"PES": "ARS", "DOL": "USD", "060": "EUR", "012": "BRL", "011": "UYU"}


def matches(text: str) -> bool:
    return bool(re.search(r"(afip|arca)\.gob\.ar", text, re.IGNORECASE)) and "p=" in text


def parse(text: str) -> Optional[Dict[str, Any]]:
    p = parse_qs(urlparse(text.strip()).query).get("p", [None])[0]
    if not p:
        return None
    try:
        data = json.loads(base64.urlsafe_b64decode(p + "=" * (-len(p) % 4)))
    except (ValueError, TypeError):
        return None
    amount = parse_amount(data.get("importe", ""))
    if amount is None or amount <= 0:
        return None
    tipo = TIPOS.get(data.get("tipoCmp"), f"Comprobante {data.get('tipoCmp', '')}".strip())
    pto, nro = data.get("ptoVta"), data.get("nroCmp")
    numero = f"{int(pto):04d}-{int(nro):08d}" if pto is not None and nro is not None else ""
    return {
        "amount": amount,
        "date": parse_date(str(data.get("fecha", ""))),
        "merchant": f"CUIT {data['cuit']}" if data.get("cuit") else None,
        "description": f"{tipo} {numero}".strip(),
        "currency": MONEDAS.get(str(data.get("moneda", ""))),
    }
