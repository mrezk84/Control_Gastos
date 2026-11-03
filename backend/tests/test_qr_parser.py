import base64
import json

from app.services.qr_parser import parse_qr
from app.services.text_utils import extract_due_date, parse_amount, parse_date



def emv(**tags):
    """Arma una cadena EMVCo mínima: 000201 + tags en orden."""
    body = "000201"
    for tag, value in tags.items():
        body += f"{tag[1:]}{len(value):02d}{value}"
    return body


class TestUtilidades:
    def test_montos_en_varios_formatos(self):
        assert parse_amount("58.000") == 58000
        assert parse_amount("1.234,56") == 1234.56
        assert parse_amount("1,234.56") == 1234.56
        assert parse_amount("12,50") == 12.5
        assert parse_amount("1234.56") == 1234.56
        assert parse_amount("abc") is None

    def test_fechas(self):
        assert parse_date("15/11/2026") == "2026-11-15"
        assert parse_date("2026-11-15") == "2026-11-15"
        assert parse_date("11/15/2026", dayfirst=False) == "2026-11-15"
        assert parse_date("31/02/2026") is None

    def test_vencimiento(self):
        assert extract_due_date("Total $100\nVencimiento: 20/11/2026") == "2026-11-20"
        assert extract_due_date("Due date 2026-12-01") == "2026-12-01"
        assert extract_due_date("sin vencimiento aquí") is None


class TestUruguay:
    def test_cfe_de_la_dgi(self):
        qr = "https://www.efactura.dgi.gub.uy/consultaQR/cfe?217654320018,101,A,12345,1250.50,28/10/2026,AbCdEf"
        r = parse_qr(qr)
        assert r["source"] == "country:uy"
        assert r["amount"] == 1250.5 and r["date"] == "2026-10-28"
        assert r["description"] == "e-Ticket A-12345" and r["merchant"] == "RUT 217654320018"

    def test_cfe_incompleto_cae_a_otros_lectores(self):
        assert parse_qr("https://www.efactura.dgi.gub.uy/consultaQR/cfe?123,101") is None


class TestArgentina:
    def test_afip(self):
        data = {"ver": 1, "fecha": "2026-10-13", "cuit": 30000000007, "ptoVta": 10, "tipoCmp": 1, "nroCmp": 94,
                "importe": 12100, "moneda": "PES", "ctz": 1}
        p = base64.urlsafe_b64encode(json.dumps(data).encode()).decode().rstrip("=")
        r = parse_qr(f"https://www.afip.gob.ar/fe/qr/?p={p}")
        assert r["source"] == "country:ar"
        assert r["amount"] == 12100 and r["date"] == "2026-10-13" and r["currency"] == "ARS"
        assert r["description"] == "Factura A 0010-00000094"


class TestInternacional:
    def test_emvco_con_moneda_y_comercio(self):
        r = parse_qr(emv(t53="858", t54="580.00", t59="Edenor"))
        assert r["source"] == "emvco" and r["amount"] == 580 and r["currency"] == "UYU"
        assert r["merchant"] == "Edenor" and r["description"] == "Pago a Edenor"

    def test_emvco_sin_monto_no_sirve(self):
        assert parse_qr(emv(t59="Kiosco")) is None

    def test_url_con_parametros(self):
        r = parse_qr("https://pagos.example.com/f?importe=1.500,00&fecha=2026-11-02&vencimiento=2026-11-20&moneda=eur")
        assert r["source"] == "url" and r["amount"] == 1500
        assert r["date"] == "2026-11-02" and r["due_date"] == "2026-11-20" and r["currency"] == "EUR"

    def test_texto_libre(self):
        r = parse_qr("Farmacia Central\nTotal: $ 850\nFecha 03/11/2026\nVencimiento: 10/11/2026")
        assert r["source"] == "text" and r["amount"] == 850
        assert r["due_date"] == "2026-11-10"

    def test_basura_y_vacio(self):
        assert parse_qr("") is None
        assert parse_qr("hola mundo sin números") is None


class TestEndpoint:
    def test_requiere_sesion(self, client):
        assert client.post("/receipts/qr", json={"text": "x"}).status_code == 401

    def test_qr_valido(self, client, auth):
        r = client.post("/receipts/qr", headers=auth, json={"text": emv(t53="840", t54="12.5", t59="Cafe")})
        assert r.status_code == 200, r.text
        d = r.json()["data"]
        assert d["amount"] == 12.5 and d["currency"] == "USD" and d["source"] == "emvco"

    def test_qr_sin_monto_da_422(self, client, auth):
        assert client.post("/receipts/qr", headers=auth, json={"text": "nada"}).status_code == 422
