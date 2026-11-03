import json
from datetime import date, timedelta

import pytest

from app.services import push as push_service

SUB = {"endpoint": "https://push.example.com/abc", "keys": {"p256dh": "BPk", "auth": "sec"}}
SECRETO = "secreto-del-cron"


@pytest.fixture()
def cron_headers(monkeypatch):
    monkeypatch.setenv("CRON_SECRET", SECRETO)
    return {"Authorization": f"Bearer {SECRETO}"}


@pytest.fixture()
def vapid(monkeypatch):
    monkeypatch.setenv("VAPID_PUBLIC_KEY", "pub-de-prueba")
    monkeypatch.setenv("VAPID_PRIVATE_KEY", "priv-de-prueba")
    monkeypatch.setenv("VAPID_SUBJECT", "mailto:test@example.com")


@pytest.fixture()
def enviados(monkeypatch, vapid):
    """Intercepta pywebpush.webpush y devuelve la lista de envíos."""
    lista = []
    monkeypatch.setattr(push_service, "webpush", lambda **kw: lista.append(kw))
    return lista


def hoy():
    # Mismo cálculo que el backend para la zona horaria por defecto del perfil
    from app.services.notify import DEFAULT_TIMEZONE
    from datetime import datetime
    from zoneinfo import ZoneInfo
    return datetime.now(ZoneInfo(DEFAULT_TIMEZONE)).date()


def recordatorio(client, headers, dias, descripcion="UTE", monto=3200):
    r = client.post("/reminders/", headers=headers, json={
        "description": descripcion, "amount": monto, "due_date": (hoy() + timedelta(days=dias)).isoformat()})
    assert r.status_code == 201, r.text
    return r.json()


class TestSuscripcion:
    def test_clave_publica(self, client, vapid):
        assert client.get("/push/vapid-key").json() == {"public_key": "pub-de-prueba"}

    def test_clave_publica_sin_configurar(self, client, monkeypatch):
        monkeypatch.delenv("VAPID_PUBLIC_KEY", raising=False)
        assert client.get("/push/vapid-key").status_code == 503

    def test_suscribir_requiere_sesion(self, client):
        assert client.post("/push/subscribe", json=SUB).status_code == 401

    def test_suscribir_es_idempotente_y_se_puede_borrar(self, client, auth):
        assert client.post("/push/subscribe", headers=auth, json=SUB).status_code == 201
        assert client.post("/push/subscribe", headers=auth, json=SUB).status_code == 201
        assert client.request("DELETE", "/push/subscribe", headers=auth, json={"endpoint": SUB["endpoint"]}).status_code == 204

    def test_otro_usuario_no_borra_mi_suscripcion(self, client, auth, other_auth, enviados):
        client.post("/push/subscribe", headers=auth, json=SUB)
        client.request("DELETE", "/push/subscribe", headers=other_auth, json={"endpoint": SUB["endpoint"]})
        client.post("/expenses/", headers=auth, json={
            "description": "x", "amount": 5, "category": "Otros", "date": hoy().isoformat(), "from_scan": True})
        assert len(enviados) == 1


class TestEnvioPush:
    def test_el_gasto_escaneado_llega_al_navegador(self, client, auth, enviados):
        client.post("/push/subscribe", headers=auth, json=SUB)
        client.post("/expenses/", headers=auth, json={
            "description": "Edenor", "amount": 58000, "category": "Servicios", "date": hoy().isoformat(),
            "from_scan": True})
        assert len(enviados) == 1
        e = enviados[0]
        assert e["subscription_info"]["endpoint"] == SUB["endpoint"]
        data = json.loads(e["data"])
        assert data["title"] == "Pago registrado" and data["body"].startswith("$58.000 en Edenor")
        assert e["vapid_claims"]["sub"] == "mailto:test@example.com"

    def test_sin_claves_vapid_solo_queda_en_la_app(self, client, auth, monkeypatch):
        monkeypatch.delenv("VAPID_PRIVATE_KEY", raising=False)
        monkeypatch.setattr(push_service, "webpush", lambda **kw: pytest.fail("no debía enviar"))
        client.post("/push/subscribe", headers=auth, json=SUB)
        client.post("/expenses/", headers=auth, json={
            "description": "x", "amount": 5, "category": "Otros", "date": hoy().isoformat(), "from_scan": True})
        assert client.get("/notifications/", headers=auth).json()["unread_count"] == 1

    def test_suscripcion_caducada_se_borra(self, client, auth, vapid, monkeypatch):
        from pywebpush import WebPushException

        class Resp:
            status_code = 410

        def falla(**kw):
            raise WebPushException("Gone", response=Resp())

        monkeypatch.setattr(push_service, "webpush", falla)
        client.post("/push/subscribe", headers=auth, json=SUB)
        body = {"description": "x", "amount": 5, "category": "Otros", "date": hoy().isoformat(), "from_scan": True}
        assert client.post("/expenses/", headers=auth, json=body).status_code == 200
        # La suscripción desapareció: un segundo gasto ya no intenta enviar
        monkeypatch.setattr(push_service, "webpush", lambda **kw: pytest.fail("la suscripción debía estar borrada"))
        assert client.post("/expenses/", headers=auth, json=body).status_code == 200

    def test_un_error_de_push_no_rompe_el_gasto(self, client, auth, vapid, monkeypatch):
        def revienta(**kw):
            raise RuntimeError("red caída")

        monkeypatch.setattr(push_service, "webpush", revienta)
        client.post("/push/subscribe", headers=auth, json=SUB)
        r = client.post("/expenses/", headers=auth, json={
            "description": "x", "amount": 5, "category": "Otros", "date": hoy().isoformat(), "from_scan": True})
        assert r.status_code == 200
        assert client.get("/notifications/", headers=auth).json()["unread_count"] == 1


class TestFirmaVapid:
    def test_claves_reales_firman_sin_error(self, client, auth, monkeypatch):
        """Con un par VAPID real, pywebpush llega a firmar y a intentar el POST (que interceptamos)."""
        import base64
        from cryptography.hazmat.primitives import serialization
        from py_vapid import Vapid
        v = Vapid()
        v.generate_keys()
        raw = v.private_key.private_numbers().private_value.to_bytes(32, "big")
        monkeypatch.setenv("VAPID_PRIVATE_KEY", base64.urlsafe_b64encode(raw).decode().rstrip("="))
        monkeypatch.setenv("VAPID_PUBLIC_KEY", base64.urlsafe_b64encode(v.public_key.public_bytes(
            serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)).decode().rstrip("="))
        llamadas = []

        class Resp:
            status_code = 201
            ok = True

        import pywebpush
        monkeypatch.setattr(pywebpush.requests, "post", lambda *a, **k: llamadas.append((a, k)) or Resp())
        # Suscripción con claves de navegador válidas (p256dh = punto EC, auth = 16 bytes)
        from cryptography.hazmat.primitives.asymmetric import ec
        cliente = ec.generate_private_key(ec.SECP256R1())
        p256dh = base64.urlsafe_b64encode(cliente.public_key().public_bytes(
            serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)).decode().rstrip("=")
        sub = {"endpoint": "https://push.example.com/real", "keys": {
            "p256dh": p256dh, "auth": base64.urlsafe_b64encode(b"0123456789abcdef").decode().rstrip("=")}}
        client.post("/push/subscribe", headers=auth, json=sub)
        client.post("/expenses/", headers=auth, json={
            "description": "x", "amount": 5, "category": "Otros", "date": hoy().isoformat(), "from_scan": True})
        assert len(llamadas) == 1
        assert "vapid" in llamadas[0][1]["headers"]["authorization"].lower()


class TestCron:
    def test_exige_secreto(self, client, cron_headers):
        assert client.get("/cron/reminders").status_code == 401
        assert client.get("/cron/reminders", headers={"Authorization": "Bearer otro"}).status_code == 401
        assert client.get("/cron/reminders", headers=cron_headers).status_code == 200

    def test_sin_secreto_configurado_nunca_queda_abierto(self, client, monkeypatch):
        monkeypatch.delenv("CRON_SECRET", raising=False)
        assert client.get("/cron/reminders").status_code == 503
        assert client.get("/cron/reminders", headers={"Authorization": "Bearer "}).status_code == 503

    def test_avisa_segun_los_dias_que_faltan(self, client, auth, cron_headers):
        recordatorio(client, auth, 3, "Tres")
        recordatorio(client, auth, 0, "Hoy")
        recordatorio(client, auth, -2, "Vencida")
        recordatorio(client, auth, 10, "Lejana")
        r = client.get("/cron/reminders", headers=cron_headers).json()
        assert r == {"checked": 4, "notified": 3}
        n = {x["kind"]: x for x in client.get("/notifications/", headers=auth).json()["notifications"]}
        assert n["due_soon"]["title"] == "Vence en 3 días" and n["due_soon"]["body"] == "Tres · $3.200"
        assert n["due_today"]["title"] == "Vence hoy" and n["overdue"]["title"] == "Pago vencido"

    def test_no_duplica_si_se_ejecuta_dos_veces(self, client, auth, cron_headers):
        recordatorio(client, auth, 1)
        assert client.get("/cron/reminders", headers=cron_headers).json()["notified"] == 1
        assert client.get("/cron/reminders", headers=cron_headers).json()["notified"] == 0
        assert client.get("/notifications/", headers=auth).json()["unread_count"] == 1

    def test_vencida_se_avisa_una_sola_vez(self, client, auth, cron_headers):
        r = recordatorio(client, auth, -1)
        assert client.get("/cron/reminders", headers=cron_headers).json()["notified"] == 1
        # Aunque pase otro día, no se repite (se simula borrando la marca de fecha)
        from app.database import get_db
        from app.main import app
        from app import models
        db = next(app.dependency_overrides[get_db]())
        db.query(models.PaymentReminder).update({"last_notified_on": date(2020, 1, 1)})
        db.commit()
        assert client.get("/cron/reminders", headers=cron_headers).json()["notified"] == 0

    def test_pagados_y_descartados_no_avisan(self, client, auth, cron_headers):
        a = recordatorio(client, auth, 0, "Pagado")
        b = recordatorio(client, auth, 0, "Descartado")
        client.post(f"/reminders/{a['id']}/pay", headers=auth)
        client.put(f"/reminders/{b['id']}", headers=auth, json={"status": "dismissed"})
        assert client.get("/cron/reminders", headers=cron_headers).json() == {"checked": 0, "notified": 0}

    def test_envia_push_y_respeta_a_cada_usuario(self, client, auth, other_auth, cron_headers, enviados):
        client.post("/push/subscribe", headers=auth, json=SUB)
        recordatorio(client, auth, 0)
        recordatorio(client, other_auth, 0)
        assert client.get("/cron/reminders", headers=cron_headers).json()["notified"] == 2
        assert len(enviados) == 1 and json.loads(enviados[0]["data"])["title"] == "Vence hoy"
        assert client.get("/notifications/", headers=other_auth).json()["unread_count"] == 1

    def test_usa_la_zona_horaria_de_cada_persona(self, client, auth, cron_headers):
        # En Kiritimati (UTC+14) ya es "mañana" respecto de Montevideo: un vencimiento de hoy-montevideo ya venció
        client.put("/auth/me", headers=auth, json={"timezone": "Pacific/Kiritimati"})
        from datetime import datetime
        from zoneinfo import ZoneInfo
        hoy_kiri = datetime.now(ZoneInfo("Pacific/Kiritimati")).date()
        client.post("/reminders/", headers=auth, json={
            "description": "X", "amount": 10, "due_date": (hoy_kiri - timedelta(days=1)).isoformat()})
        client.get("/cron/reminders", headers=cron_headers)
        assert client.get("/notifications/", headers=auth).json()["notifications"][0]["kind"] == "overdue"
