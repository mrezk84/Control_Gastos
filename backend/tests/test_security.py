"""Regresiones de la auditoría de seguridad (docs/security/AUDITORIA.md).

Las seis pruebas de la auditoría documentaban el comportamiento vulnerable; aquí están invertidas: exigen
rechazo, revocación o neutralización. Ninguna sale a la red: Google/Microsoft y los servicios push se simulan.
"""
import base64
import csv
import hashlib
import importlib
import io
import os
from datetime import datetime, timedelta
from urllib.parse import parse_qs, urlparse

import pytest
from openpyxl import load_workbook
from PIL import Image
from starlette.requests import Request

from app import models
from app.database import get_db
from app.main import app
from app.routes import oauth_routes
from app.services import push as push_service
from .conftest import login, png_bytes, register
from .test_expenses import crear
from .test_receipts import subir


def db_session():
    """Sesión sobre la misma base en memoria de la prueba (la del override de get_db)."""
    return next(app.dependency_overrides[get_db]())


def b64url_sha256(value: str) -> str:
    return base64.urlsafe_b64encode(hashlib.sha256(value.encode()).digest()).rstrip(b"=").decode()


def make_request(headers=None, host="9.9.9.9"):
    return Request({
        "type": "http",
        "headers": [(k.lower().encode(), v.encode()) for k, v in (headers or {}).items()],
        "client": (host, 1234),
    })


# --------------------------------------------------------------------------------------------------
# 4. Recuperación de un solo uso y sesiones revocadas
# --------------------------------------------------------------------------------------------------
class TestRecuperacionDeUnSoloUso:
    def _enlace(self, client, sent_emails, email="ana@example.com"):
        client.post("/auth/forgot-password", json={"email": email})
        return parse_qs(urlparse(sent_emails[-1][1]).query)["token"][0]

    def test_el_enlace_solo_sirve_una_vez(self, client, auth, sent_emails):
        token = self._enlace(client, sent_emails)
        assert client.post("/auth/reset-password", json={"token": token, "new_password": "nuevo1234"}).status_code == 200
        assert client.post("/auth/reset-password", json={"token": token, "new_password": "otro12345"}).status_code == 400
        assert login(client, password="nuevo1234").status_code == 200
        assert login(client, password="otro12345").status_code == 401

    def test_la_sesion_anterior_queda_revocada(self, client, auth, sent_emails):
        assert client.get("/auth/me", headers=auth).status_code == 200
        token = self._enlace(client, sent_emails)
        client.post("/auth/reset-password", json={"token": token, "new_password": "nuevo1234"})
        assert client.get("/auth/me", headers=auth).status_code == 401
        nueva = login(client, password="nuevo1234").json()["access_token"]
        assert client.get("/auth/me", headers={"Authorization": f"Bearer {nueva}"}).status_code == 200

    def test_pedir_otro_enlace_invalida_el_anterior(self, client, auth, sent_emails):
        primero = self._enlace(client, sent_emails)
        segundo = self._enlace(client, sent_emails)
        assert client.post("/auth/reset-password", json={"token": primero, "new_password": "nuevo1234"}).status_code == 400
        assert client.post("/auth/reset-password", json={"token": segundo, "new_password": "nuevo1234"}).status_code == 200

    def test_el_enlace_vence(self, client, auth, sent_emails):
        token = self._enlace(client, sent_emails)
        with db_session() as db:
            db.query(models.PasswordResetToken).update({"expires_at": datetime.utcnow() - timedelta(seconds=1)})
            db.commit()
        assert client.post("/auth/reset-password", json={"token": token, "new_password": "nuevo1234"}).status_code == 400

    def test_en_la_base_solo_queda_el_hash(self, client, auth, sent_emails):
        token = self._enlace(client, sent_emails)
        with db_session() as db:
            guardado = db.query(models.PasswordResetToken).one().token_hash
        assert guardado == hashlib.sha256(token.encode()).hexdigest() and guardado != token

    def test_un_token_de_sesion_antiguo_sin_version_sigue_valiendo_mientras_no_se_restablezca(self, client, auth):
        from .test_auth import token_for
        assert client.get("/auth/me", headers={"Authorization": f"Bearer {token_for('ana')}"}).status_code == 200

    def test_la_contrasena_nueva_exige_8_caracteres(self, client, auth, sent_emails):
        token = self._enlace(client, sent_emails)
        assert client.post("/auth/reset-password", json={"token": token, "new_password": "corta12"}).status_code == 422
        assert register(client, "beto", "beto@example.com", "corta12").status_code == 400


# --------------------------------------------------------------------------------------------------
# 3. Limitación de intentos
# --------------------------------------------------------------------------------------------------
class TestLimiteDeIntentos:
    def test_el_login_se_bloquea_tras_cinco_intentos_por_cuenta(self, client):
        codigos = [client.post("/auth/token", data={"username": "nadie", "password": "mala"}).status_code for _ in range(7)]
        assert codigos == [401] * 5 + [429] * 2

    def test_el_bloqueo_trae_retry_after_y_alcanza_a_la_contrasena_correcta(self, client, auth):
        for _ in range(5):
            client.post("/auth/token", data={"username": "ana", "password": "mala"})
        r = login(client)  # contraseña correcta, pero la cuenta está bloqueada
        assert r.status_code == 429 and int(r.headers["Retry-After"]) > 0

    def test_un_login_correcto_reinicia_el_contador_de_la_cuenta(self, client, auth):
        for _ in range(3):
            client.post("/auth/token", data={"username": "ana", "password": "mala"})
        assert login(client).status_code == 200
        for _ in range(4):
            assert client.post("/auth/token", data={"username": "ana", "password": "mala"}).status_code == 401

    def test_bloquear_una_cuenta_no_bloquea_a_las_demas(self, client, auth):
        for _ in range(6):
            client.post("/auth/token", data={"username": "ana", "password": "mala"})
        register(client, "beto", "beto@example.com")
        assert login(client, "beto").status_code == 200

    @pytest.mark.parametrize("correo", ["ana@example.com", "nadie@example.com"])
    def test_recuperar_contrasena_se_limita_igual_exista_o_no_la_cuenta(self, client, auth, sent_emails, correo):
        codigos = [client.post("/auth/forgot-password", json={"email": correo}).status_code for _ in range(4)]
        assert codigos == [200, 200, 200, 429]

    def test_recuperar_contrasena_tambien_se_limita_por_ip(self, client, sent_emails):
        codigos = [client.post("/auth/forgot-password", json={"email": f"u{i}@example.com"}).status_code for i in range(7)]
        assert codigos == [200] * 5 + [429] * 2

    def test_el_registro_se_limita_por_ip(self, client):
        codigos = [register(client, f"u{i}", f"u{i}@example.com").status_code for i in range(12)]
        assert codigos[:10] == [201] * 10 and codigos[10:] == [429] * 2

    def test_la_cabecera_x_forwarded_for_no_se_cree_sin_proxy_de_confianza(self, monkeypatch):
        from app import rate_limiter
        monkeypatch.delenv("VERCEL", raising=False)
        monkeypatch.delenv("TRUST_PROXY_HEADERS", raising=False)
        assert rate_limiter.client_ip(make_request({"X-Forwarded-For": "1.2.3.4"})) == "9.9.9.9"

    def test_en_vercel_se_usa_la_ip_que_informa_la_plataforma(self, monkeypatch):
        from app import rate_limiter
        monkeypatch.setenv("VERCEL", "1")
        assert rate_limiter.client_ip(make_request({"x-vercel-forwarded-for": "5.6.7.8"})) == "5.6.7.8"

    def test_con_proxy_propio_se_usa_la_ultima_entrada(self, monkeypatch):
        from app import rate_limiter
        monkeypatch.delenv("VERCEL", raising=False)
        monkeypatch.setenv("TRUST_PROXY_HEADERS", "1")
        # el cliente escribe la primera; el proxy añade la última
        assert rate_limiter.client_ip(make_request({"X-Forwarded-For": "6.6.6.6, 5.6.7.8"})) == "5.6.7.8"


# --------------------------------------------------------------------------------------------------
# 1, 5 y 6. Acceso social
# --------------------------------------------------------------------------------------------------
VERIFICADOR = "verificador-aleatorio-del-navegador-de-ana"


class FakeResponse:
    def __init__(self, status_code=200, payload=None):
        self.status_code = status_code
        self._payload = payload or {}
        self.text = str(payload)

    def json(self):
        return self._payload


@pytest.fixture()
def proveedor(monkeypatch):
    """Simula Google/Microsoft: `info` es el perfil que devuelve y `peticiones` lo que el backend envió."""
    monkeypatch.setitem(oauth_routes.PROVIDERS["google"], "client_id", "id-de-prueba")
    monkeypatch.setitem(oauth_routes.PROVIDERS["microsoft"], "client_id", "id-de-prueba")
    estado = {"info": {"id": "g-1", "email": "ana@example.com", "verified_email": True}, "peticiones": []}

    class FakeClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *exc):
            return False

        async def post(self, url, data=None, **kwargs):
            estado["peticiones"].append(data)
            return FakeResponse(200, {"access_token": "token-del-proveedor"})

        async def get(self, url, **kwargs):
            return FakeResponse(200, estado["info"])

    monkeypatch.setattr(oauth_routes.httpx, "AsyncClient", FakeClient)
    return estado


def iniciar(client, provider="google", verificador=VERIFICADOR):
    """Paso 1: el navegador pide la URL. Devuelve (state, code_challenge que viaja al proveedor)."""
    url = client.get(f"/auth/{provider}", params={"challenge": b64url_sha256(verificador)}).json()["auth_url"]
    query = parse_qs(urlparse(url).query)
    return query["state"][0], query["code_challenge"][0]


def volver(client, state, provider="google", **extra):
    """Paso 2: el proveedor vuelve al backend; devuelve los parámetros de la redirección al frontend."""
    r = client.get(f"/auth/{provider}/callback", params={"code": "codigo-del-proveedor", "state": state, **extra},
                   follow_redirects=False)
    assert r.status_code == 307
    return parse_qs(urlparse(r.headers["location"]).query), r.headers["location"]


class TestAccesoSocial:
    def test_flujo_completo_y_el_jwt_nunca_viaja_por_la_url(self, client, proveedor):
        state, _ = iniciar(client)
        params, ubicacion = volver(client, state)
        assert "token" not in params and "eyJ" not in ubicacion  # ni un JWT en la URL
        r = client.post("/auth/oauth/exchange", json={"code": params["code"][0], "verifier": VERIFICADOR})
        assert r.status_code == 200
        me = client.get("/auth/me", headers={"Authorization": f"Bearer {r.json()['access_token']}"})
        assert me.status_code == 200 and me.json()["email"] == "ana@example.com"

    def test_el_state_es_de_un_solo_uso(self, client, proveedor):
        state, _ = iniciar(client)
        volver(client, state)
        params, _ = volver(client, state)
        assert params == {"error": ["sesion_expirada"]}

    def test_el_state_vence(self, client, proveedor):
        state, _ = iniciar(client)
        with db_session() as db:
            db.query(models.OAuthFlow).update({"expires_at": datetime.utcnow() - timedelta(seconds=1)})
            db.commit()
        assert volver(client, state)[0] == {"error": ["sesion_expirada"]}

    def test_el_codigo_es_de_un_solo_uso(self, client, proveedor):
        state, _ = iniciar(client)
        code = volver(client, state)[0]["code"][0]
        assert client.post("/auth/oauth/exchange", json={"code": code, "verifier": VERIFICADOR}).status_code == 200
        assert client.post("/auth/oauth/exchange", json={"code": code, "verifier": VERIFICADOR}).status_code == 400

    def test_otro_navegador_no_puede_canjear_el_codigo(self, client, proveedor):
        """Login CSRF: el enlace con el código del atacante llega a la víctima, que no tiene su verificador."""
        state, _ = iniciar(client)  # lo inició el atacante
        code = volver(client, state)[0]["code"][0]
        r = client.post("/auth/oauth/exchange", json={"code": code, "verifier": "verificador-de-la-victima"})
        assert r.status_code == 400
        # y el código queda quemado: ni siquiera el verificador correcto lo recupera
        assert client.post("/auth/oauth/exchange", json={"code": code, "verifier": VERIFICADOR}).status_code == 400

    def test_el_codigo_vence(self, client, proveedor):
        state, _ = iniciar(client)
        code = volver(client, state)[0]["code"][0]
        with db_session() as db:
            db.query(models.OAuthFlow).update({"code_expires_at": datetime.utcnow() - timedelta(seconds=1)})
            db.commit()
        assert client.post("/auth/oauth/exchange", json={"code": code, "verifier": VERIFICADOR}).status_code == 400

    def test_pkce_con_el_proveedor(self, client, proveedor):
        state, code_challenge = iniciar(client)
        volver(client, state)
        verifier = proveedor["peticiones"][0]["code_verifier"]
        assert b64url_sha256(verifier) == code_challenge and 43 <= len(verifier) <= 128

    def test_cancelar_en_el_proveedor_vuelve_con_aviso(self, client, proveedor):
        state, _ = iniciar(client)
        r = client.get("/auth/google/callback", params={"error": "access_denied", "state": state}, follow_redirects=False)
        assert parse_qs(urlparse(r.headers["location"]).query) == {"error": ["cancelado"]}

    def test_google_sin_correo_verificado_se_rechaza(self, client, proveedor):
        proveedor["info"]["verified_email"] = False
        state, _ = iniciar(client)
        assert volver(client, state)[0] == {"error": ["correo_no_verificado"]}

    def test_quien_registro_antes_el_correo_no_hereda_el_acceso_social(self, client, proveedor):
        """Apropiación anticipada: el atacante registra el correo de la víctima con su contraseña."""
        register(client, "atacante", "ana@example.com", "clave-del-atacante")
        state, _ = iniciar(client)  # la víctima entra con Google
        params, _ = volver(client, state)
        assert params == {"error": ["correo_en_uso"]}
        with db_session() as db:
            cuenta = db.query(models.User).filter(models.User.username == "atacante").one()
            assert cuenta.provider_id is None and cuenta.auth_provider == "local"  # sin vincular
            assert db.query(models.User).count() == 1  # y no se creó otra con el mismo correo
        assert login(client, "atacante", "clave-del-atacante").status_code == 200  # su cuenta sigue siendo suya, sin la de nadie más

    def test_el_correo_solo_no_basta_entre_proveedores(self, client, proveedor):
        state, _ = iniciar(client, "google")
        volver(client, state)  # Google crea la cuenta de ana@example.com
        proveedor["info"] = {"sub": "ms-9", "email": "ana@example.com"}
        state, _ = iniciar(client, "microsoft")
        assert volver(client, state, "microsoft")[0] == {"error": ["correo_en_uso"]}

    def test_la_identidad_estable_gana_aunque_cambie_el_correo(self, client, proveedor):
        state, _ = iniciar(client)
        volver(client, state)
        proveedor["info"] = {"id": "g-1", "email": "ana.nueva@example.com", "verified_email": True}
        state, _ = iniciar(client)
        code = volver(client, state)[0]["code"][0]
        token = client.post("/auth/oauth/exchange", json={"code": code, "verifier": VERIFICADOR}).json()["access_token"]
        me = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"}).json()
        assert me["email"] == "ana@example.com"  # la misma cuenta
        with db_session() as db:
            assert db.query(models.User).count() == 1

    def test_una_cuenta_huerfana_sin_contrasena_ni_identidad_se_puede_reclamar(self, client, proveedor):
        with db_session() as db:
            db.add(models.User(username="vieja", email="ana@example.com", hashed_password=None, auth_provider="local"))
            db.commit()
        state, _ = iniciar(client)
        assert "code" in volver(client, state)[0]

    def test_el_challenge_debe_ser_un_sha256_en_base64url(self, client, proveedor):
        assert client.get("/auth/google", params={"challenge": "x" * 43 + "!"}).status_code == 422
        assert client.get("/auth/google", params={"challenge": "corto"}).status_code == 422


# --------------------------------------------------------------------------------------------------
# 2. SSRF por Web Push
# --------------------------------------------------------------------------------------------------
KEYS = {"p256dh": "BPk", "auth": "sec"}


@pytest.fixture()
def dns_publico(monkeypatch):
    monkeypatch.setattr(push_service, "_resolve", lambda host: ["142.250.0.1"])


@pytest.fixture()
def vapid(monkeypatch):
    monkeypatch.setenv("VAPID_PUBLIC_KEY", "pub-de-prueba")
    monkeypatch.setenv("VAPID_PRIVATE_KEY", "priv-de-prueba")


class TestSsrfPush:
    @pytest.mark.parametrize("endpoint", [
        "https://127.0.0.1:8443/internal",
        "https://127.0.0.1/internal",
        "https://169.254.169.254/latest/meta-data",
        "https://[::1]/x",
        "http://fcm.googleapis.com/fcm/send/abc",                # sin HTTPS
        "https://fcm.googleapis.com:8443/fcm/send/abc",           # puerto no estándar
        "https://fcm.googleapis.com@evil.example/x",              # el host real es evil.example
        "https://usuario:clave@fcm.googleapis.com/fcm/send/abc",  # credenciales en la URL
        "https://fcm.googleapis.com.evil.example/x",              # el prefijo no basta
        "https://evilfcm.googleapis.com/x",                       # ni un subdominio inventado
        "https://notify.windows.com.evil.example/x",
        "https://localhost/x",
        "https://push.example.com/abc",
        "ftp://fcm.googleapis.com/x",
        "https://fcm.googleapis.com/" + "a" * 1000,               # demasiado larga
    ])
    def test_endpoints_no_permitidos_se_rechazan(self, client, auth, endpoint):
        r = client.post("/push/subscribe", headers=auth, json={"endpoint": endpoint, "keys": KEYS})
        assert r.status_code == 422

    @pytest.mark.parametrize("endpoint", [
        "https://fcm.googleapis.com/fcm/send/abc",
        "https://updates.push.services.mozilla.com/wpush/v2/abc",
        "https://autopush.push.services.mozilla.com/wpush/v2/abc",
        "https://wns2-par02p.notify.windows.com/w/?token=abc",
        "https://web.push.apple.com/abc",
    ])
    def test_los_servicios_push_de_los_navegadores_se_aceptan(self, client, auth, endpoint):
        assert client.post("/push/subscribe", headers=auth, json={"endpoint": endpoint, "keys": KEYS}).status_code == 201

    def test_hosts_extra_por_configuracion(self, client, auth, monkeypatch):
        endpoint = "https://push.mi-empresa.example/abc"
        assert client.post("/push/subscribe", headers=auth, json={"endpoint": endpoint, "keys": KEYS}).status_code == 422
        monkeypatch.setenv("PUSH_ALLOWED_HOSTS", "push.mi-empresa.example")
        assert client.post("/push/subscribe", headers=auth, json={"endpoint": endpoint, "keys": KEYS}).status_code == 201

    def test_una_suscripcion_interna_ya_guardada_nunca_se_contacta_y_se_elimina(
            self, client, auth, vapid, dns_publico, monkeypatch):
        monkeypatch.setattr(push_service, "webpush", lambda **kw: pytest.fail("contactó un destino no permitido"))
        with db_session() as db:
            uid = db.query(models.User).one().id
            db.add(models.PushSubscription(user_id=uid, endpoint="https://127.0.0.1:8443/internal", p256dh="a", auth="b"))
            db.commit()
        r = client.post("/expenses/", headers=auth, json={
            "description": "x", "category": "Otros", "amount": 1, "date": "2026-11-09", "from_scan": True})
        assert r.status_code == 200
        with db_session() as db:
            assert db.query(models.PushSubscription).count() == 0

    def test_un_dns_que_apunta_a_una_direccion_interna_no_se_contacta(self, client, auth, vapid, monkeypatch):
        monkeypatch.setattr(push_service, "_resolve", lambda host: ["10.0.0.5"])
        monkeypatch.setattr(push_service, "webpush", lambda **kw: pytest.fail("contactó una dirección privada"))
        client.post("/push/subscribe", headers=auth, json={"endpoint": "https://fcm.googleapis.com/fcm/send/abc", "keys": KEYS})
        client.post("/expenses/", headers=auth, json={
            "description": "x", "category": "Otros", "amount": 1, "date": "2026-11-09", "from_scan": True})
        with db_session() as db:
            assert db.query(models.PushSubscription).count() == 0

    def test_el_envio_usa_timeout_y_sesion_sin_redirecciones(self, client, auth, vapid, dns_publico, monkeypatch):
        enviados = []
        monkeypatch.setattr(push_service, "webpush", lambda **kw: enviados.append(kw))
        client.post("/push/subscribe", headers=auth, json={"endpoint": "https://fcm.googleapis.com/fcm/send/abc", "keys": KEYS})
        client.post("/expenses/", headers=auth, json={
            "description": "x", "category": "Otros", "amount": 1, "date": "2026-11-09", "from_scan": True})
        assert enviados[0]["timeout"] == push_service.PUSH_TIMEOUT_SECONDS
        assert isinstance(enviados[0]["requests_session"], push_service._NoRedirectSession)

    def test_tope_de_suscripciones_por_persona(self, client, auth):
        for i in range(push_service.MAX_SUBSCRIPTIONS_PER_USER + 2):
            client.post("/push/subscribe", headers=auth, json={
                "endpoint": f"https://fcm.googleapis.com/fcm/send/{i}", "keys": KEYS})
        with db_session() as db:
            endpoints = {s.endpoint for s in db.query(models.PushSubscription).all()}
        assert len(endpoints) == push_service.MAX_SUBSCRIPTIONS_PER_USER
        assert "https://fcm.googleapis.com/fcm/send/0" not in endpoints  # se descartan las más antiguas
        assert f"https://fcm.googleapis.com/fcm/send/{push_service.MAX_SUBSCRIPTIONS_PER_USER + 1}" in endpoints


# --------------------------------------------------------------------------------------------------
# 7. Inyección de fórmulas en exportaciones
# --------------------------------------------------------------------------------------------------
PELIGROSAS = ["=1+1", "+1+1", "-1+1", "@SUM(1,1)", "\t=1+1", '=HYPERLINK("http://evil.example","x")']


class TestFormulasEnExportaciones:
    @pytest.mark.parametrize("texto", PELIGROSAS)
    def test_excel_guarda_los_textos_como_texto(self, client, auth, texto):
        crear(client, auth, description=texto, category=texto)
        celdas = load_workbook(io.BytesIO(client.get("/expenses/export/excel", headers=auth).content)).active
        for ref in ("B2", "C2"):
            assert celdas[ref].data_type == "s" and celdas[ref].value == texto

    @pytest.mark.parametrize("texto", PELIGROSAS)
    def test_csv_antepone_una_comilla(self, client, auth, texto):
        crear(client, auth, description=texto, category="Otros")
        contenido = client.get("/expenses/export/csv", headers=auth).content.decode("utf-8-sig")
        fila = list(csv.reader(io.StringIO(contenido)))[1]
        assert fila[1] == "'" + texto and not fila[1].startswith(("=", "+", "-", "@", "\t"))

    def test_los_textos_normales_y_los_montos_no_cambian(self, client, auth):
        crear(client, auth, description="Supermercado", category="Comida", amount=12.5)
        fila = list(csv.reader(io.StringIO(client.get("/expenses/export/csv", headers=auth).content.decode("utf-8-sig"))))[1]
        assert fila[1:] == ["Supermercado", "Comida", "12.5"]

    def test_exportar_e_importar_no_acumula_comillas(self, client, auth):
        crear(client, auth, description="=1+1", category="Otros")
        exportado = client.get("/expenses/export/csv", headers=auth).content
        r = client.post("/expenses/import/csv", headers=auth, files={"file": ("gastos.csv", exportado, "text/csv")})
        assert r.json()["imported"] == 1
        assert {e["description"] for e in client.get("/expenses/", headers=auth).json()} == {"=1+1"}


# --------------------------------------------------------------------------------------------------
# 8. Cuotas y límites
# --------------------------------------------------------------------------------------------------
class TestCuotasYLimites:
    def test_importacion_rechaza_archivos_grandes(self, client, auth, monkeypatch):
        expenses = importlib.import_module("app.routes.expenses")  # app.routes.expenses a secas es el router
        monkeypatch.setattr(expenses, "MAX_IMPORT_BYTES", 100)
        r = client.post("/expenses/import/csv", headers=auth, files={"file": ("g.csv", b"x" * 500, "text/csv")})
        assert r.status_code == 413

    def test_importacion_rechaza_demasiadas_filas_sin_importar_ninguna(self, client, auth, monkeypatch):
        expenses = importlib.import_module("app.routes.expenses")  # app.routes.expenses a secas es el router
        monkeypatch.setattr(expenses, "MAX_IMPORT_ROWS", 3)
        csv_ = "Fecha,Descripción,Categoría,Monto\n" + "2026-11-01,a,Otros,1\n" * 4
        r = client.post("/expenses/import/csv", headers=auth, files={"file": ("g.csv", csv_.encode(), "text/csv")})
        assert r.status_code == 413
        assert client.get("/expenses/", headers=auth).json() == []

    def test_importacion_descarta_montos_no_finitos_o_enormes_y_textos_largos(self, client, auth):
        csv_ = ("Fecha,Descripción,Categoría,Monto\n"
                "2026-11-01,inf,Otros,inf\n2026-11-01,nan,Otros,nan\n2026-11-01,enorme,Otros,1e30\n"
                f"2026-11-01,{'x' * 300},Otros,5\n2026-11-01,bien,Otros,5\n")
        r = client.post("/expenses/import/csv", headers=auth, files={"file": ("g.csv", csv_.encode(), "text/csv")}).json()
        assert r["imported"] == 1 and r["error_count"] == 4

    def test_listado_de_gastos_paginado_y_acotado(self, client, auth):
        for i in range(5):
            crear(client, auth, description=f"g{i}", date=f"2026-11-0{i + 1}")
        todos = [e["description"] for e in client.get("/expenses/", headers=auth).json()]
        assert len(todos) == 5
        pagina = [e["description"] for e in client.get("/expenses/", headers=auth, params={"limit": 2, "offset": 1}).json()]
        assert pagina == todos[1:3]
        assert client.get("/expenses/", headers=auth, params={"limit": 0}).status_code == 422
        assert client.get("/expenses/", headers=auth, params={"limit": 5001}).status_code == 422

    def test_listado_de_recordatorios_acotado(self, client, auth):
        assert client.get("/reminders/", headers=auth, params={"limit": 1001}).status_code == 422
        assert client.get("/reminders/", headers=auth, params={"limit": 10, "offset": 0}).status_code == 200

    def test_cuota_de_recibos_por_persona(self, client, auth, monkeypatch):
        receipts = importlib.import_module("app.routes.receipts")
        monkeypatch.setattr(receipts, "MAX_RECEIPTS_PER_USER", 2)
        g = crear(client, auth)
        assert subir(client, auth, g["id"]).status_code == 200
        assert subir(client, auth, g["id"]).status_code == 200
        r = subir(client, auth, g["id"])
        assert r.status_code == 413 and "límite" in r.json()["detail"]

    def test_cuota_de_almacenamiento_por_persona(self, client, auth, monkeypatch):
        receipts = importlib.import_module("app.routes.receipts")
        g = crear(client, auth)
        primero = subir(client, auth, g["id"])
        tamano = len(client.get(f"/receipts/{primero.json()['id']}/file", headers=auth).content)
        monkeypatch.setattr(receipts, "MAX_STORAGE_PER_USER", tamano + 10)
        assert subir(client, auth, g["id"]).status_code == 413

    def test_la_cuota_de_recibos_no_mezcla_personas(self, client, auth, other_auth, monkeypatch):
        receipts = importlib.import_module("app.routes.receipts")
        monkeypatch.setattr(receipts, "MAX_RECEIPTS_PER_USER", 1)
        assert subir(client, auth, crear(client, auth)["id"]).status_code == 200
        assert subir(client, other_auth, crear(client, other_auth)["id"]).status_code == 200

    def test_escaneos_por_hora_limitados(self, client, auth, monkeypatch):
        receipts = importlib.import_module("app.routes.receipts")
        monkeypatch.setattr(receipts, "SCANS_PER_HOUR", 2)
        enviar = lambda: client.post("/receipts/scan", headers=auth, files={"file": ("r.png", png_bytes((50, 50)), "image/png")})
        assert enviar().status_code != 429
        assert enviar().status_code != 429
        assert enviar().status_code == 429

    def test_pdf_con_demasiadas_paginas(self, client, auth):
        buf = io.BytesIO()
        paginas = [Image.new("RGB", (40, 40), "white") for _ in range(12)]
        paginas[0].save(buf, "PDF", save_all=True, append_images=paginas[1:])
        r = client.post("/receipts/scan", headers=auth, files={"file": ("f.pdf", buf.getvalue(), "application/pdf")})
        assert r.status_code == 500 and "demasiadas páginas" in r.json()["detail"]

    def test_imagen_bomba_de_descompresion_se_rechaza(self, client, auth):
        # 10000 x 10000 = 100 Mpx: supera el máximo configurado y no debe decodificarse
        buf = io.BytesIO()
        Image.new("1", (10000, 10000)).save(buf, "PNG")
        g = crear(client, auth)
        r = subir(client, auth, g["id"], contenido=buf.getvalue())
        assert r.status_code == 400

    def test_cuerpo_gigante_rechazado_antes_de_procesarse(self, client):
        r = client.post("/auth/register", content=b"x" * (5 * 1024 * 1024 + 10), headers={"content-type": "application/json"})
        assert r.status_code == 413
