"""Uruguay: CFE de la DGI (e-Ticket, e-Factura y notas).

URL: https://www.efactura.dgi.gub.uy/consultaQR/cfe?RUT,TIPO,SERIE,NUMERO,MONTO,FECHA,HASH
Formato NO verificado contra un QR real: se lee de forma tolerante (ver docs/specs/recordatorios.md).
"""
import re
from typing import Any, Dict, Optional

from ..text_utils import parse_amount, parse_date

TIPOS = {
    "101": "e-Ticket", "102": "Nota de crédito e-Ticket", "103": "Nota de débito e-Ticket",
    "111": "e-Factura", "112": "Nota de crédito e-Factura", "113": "Nota de débito e-Factura",
    "121": "e-Factura de exportación", "131": "e-Ticket de contingencia", "141": "e-Remito",
}


def matches(text: str) -> bool:
    return bool(re.search(r"dgi\.gub\.uy", text, re.IGNORECASE)) and "?" in text


def parse(text: str) -> Optional[Dict[str, Any]]:
    query = text.split("?", 1)[1].strip()
    parts = [p.strip() for p in query.split(",")]
    if len(parts) < 5:
        return None
    rut, tipo, serie, numero, monto = parts[:5]
    amount = parse_amount(monto)
    if amount is None or amount <= 0:
        return None
    fecha = next((parse_date(p) for p in parts[5:] if re.search(r"\d{1,2}/\d{1,2}/\d{4}", p)), None)
    nombre = TIPOS.get(tipo, f"CFE {tipo}")
    numero_cfe = f"{serie}-{numero}" if serie else numero
    return {
        "amount": amount,
        "date": fecha,
        "merchant": f"RUT {rut}" if rut else None,
        "description": f"{nombre} {numero_cfe}",
        "currency": None,
    }
