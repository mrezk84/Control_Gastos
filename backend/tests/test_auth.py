from datetime import datetime, timedelta, timezone

from jose import jwt

from app.auth.utils import ALGORITHM, SECRET_KEY
from .conftest import login, register


def token_for(username, **extra):
    payload = {"sub": username, "exp": datetime.now(timezone.utc) + timedelta(minutes=5), **extra}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


class TestRegistroYLogin:
    def test_registro_devuelve_el_usuario_sin_contrasena(self, client):
        r = register(client)
        assert r.status_code == 201
        assert r.json()["username"] == "ana"
        assert "password" not in r.json() and "hashed_password" not in r.json()

    def test_usuario_duplicado(self, client):
        register(client)
        assert register(client, email="otro@example.com").status_code == 400

    def test_email_duplicado_sin_distinguir_mayusculas(self, client):
        register(client, email="ana@example.com")
        assert register(client, username="otra", email="ANA@Example.com").status_code == 400

    def test_el_email_se_guarda_en_minusculas(self, client):
        assert register(client, email="Ana@Example.COM").json()["email"] == "ana@example.com"

    def test_contrasena_corta(self, client):
        assert register(client, password="123").status_code == 400

    def test_login_por_usuario_y_por_email(self, client):
        register(client)
        assert login(client, "ana").status_code == 200
        assert login(client, "ANA@example.com").status_code == 200

    def test_contrasena_incorrecta_y_usuario_inexistente(self, client):
        register(client)
        assert login(client, "ana", "mala").status_code == 401
        assert login(client, "nadie").status_code == 401

    def test_un_comodin_de_sql_no_coincide_con_otras_cuentas(self, client):
        # Con ilike, "_" y "%" actuaban como comodín y podían apuntar a otro correo
        register(client, "axb", "axb@example.com")
        assert login(client, "a_b@example.com").status_code == 401
        assert login(client, "a%@example.com").status_code == 401


class TestSesion:
    def test_me_con_y_sin_token(self, client, auth):
        assert client.get("/auth/me", headers=auth).json()["username"] == "ana"
        assert client.get("/auth/me").status_code == 401
        assert client.get("/auth/me", headers={"Authorization": "Bearer basura"}).status_code == 401

    def test_token_vencido(self, client):
        register(client)
        vencido = jwt.encode({"sub": "ana", "exp": datetime.now(timezone.utc) - timedelta(minutes=1)}, SECRET_KEY, algorithm=ALGORITHM)
        assert client.get("/auth/me", headers={"Authorization": f"Bearer {vencido}"}).status_code == 401

    def test_token_firmado_con_otra_clave(self, client):
        register(client)
        falso = jwt.encode({"sub": "ana", "exp": datetime.now(timezone.utc) + timedelta(minutes=5)}, "otra-clave", algorithm=ALGORITHM)
        assert client.get("/auth/me", headers={"Authorization": f"Bearer {falso}"}).status_code == 401

    def test_un_token_de_recuperacion_no_sirve_como_sesion(self, client):
        register(client)
        reset = token_for("ana", purpose="reset")
        assert client.get("/auth/me", headers={"Authorization": f"Bearer {reset}"}).status_code == 401


class TestRecuperacionDeContrasena:
    def test_la_respuesta_es_igual_exista_o_no_la_cuenta(self, client):
        register(client)
        existe = client.post("/auth/forgot-password", json={"email": "ana@example.com"})
        no_existe = client.post("/auth/forgot-password", json={"email": "nadie@example.com"})
        assert existe.status_code == no_existe.status_code == 200
        assert existe.json() == no_existe.json()

    def test_el_enlace_nunca_viaja_en_la_respuesta(self, client):
        register(client)
        r = client.post("/auth/forgot-password", json={"email": "ana@example.com"})
        assert "reset_url" not in r.json() and "token" not in str(r.json())

    def test_el_enlace_se_envia_por_correo(self, client, sent_emails):
        register(client)
        client.post("/auth/forgot-password", json={"email": "ANA@example.com"})
        assert len(sent_emails) == 1
        assert sent_emails[0][0] == "ana@example.com"
        assert sent_emails[0][1].startswith("http://localhost:3000/reset-password?token=")

    def test_no_se_envia_nada_a_cuentas_inexistentes(self, client, sent_emails):
        client.post("/auth/forgot-password", json={"email": "nadie@example.com"})
        assert sent_emails == []

    def test_flujo_completo_cambia_la_contrasena(self, client, sent_emails):
        register(client)
        client.post("/auth/forgot-password", json={"email": "ana@example.com"})
        token = sent_emails[0][1].split("token=")[1]
        r = client.post("/auth/reset-password", json={"token": token, "new_password": "nueva123"})
        assert r.status_code == 200
        assert login(client, "ana", "secreto1").status_code == 401
        assert login(client, "ana", "nueva123").status_code == 200

    def test_reset_rechaza_un_token_de_sesion(self, client):
        register(client)
        sesion = login(client).json()["access_token"]
        r = client.post("/auth/reset-password", json={"token": sesion, "new_password": "nueva123"})
        assert r.status_code == 400
        assert login(client, "ana", "secreto1").status_code == 200

    def test_reset_rechaza_token_invalido_y_contrasena_corta(self, client):
        register(client)
        assert client.post("/auth/reset-password", json={"token": "basura", "new_password": "nueva123"}).status_code == 400
        assert client.post("/auth/reset-password", json={"token": token_for("ana", purpose="reset"), "new_password": "123"}).status_code == 422


class TestOAuth:
    def test_sin_credenciales_responde_501(self, client):
        assert client.get("/auth/google").status_code == 501
        assert client.get("/auth/microsoft").status_code == 501

    def test_el_callback_rechaza_un_state_invalido(self, client, monkeypatch, sin_red):
        # Con credenciales configuradas, un state forjado o ausente no debe aceptarse (CSRF)
        from app.routes import oauth_routes
        monkeypatch.setitem(oauth_routes.PROVIDERS["google"], "client_id", "id-de-prueba")
        assert client.get("/auth/google/callback", params={"code": "x", "state": "forjado"}).status_code == 400
        assert client.get("/auth/google/callback", params={"code": "x"}).status_code == 422

    def test_un_state_de_otro_proveedor_no_vale(self, client, monkeypatch, sin_red):
        from app.routes import oauth_routes
        monkeypatch.setitem(oauth_routes.PROVIDERS["google"], "client_id", "id-de-prueba")
        state_microsoft = oauth_routes._make_state("microsoft")
        assert client.get("/auth/google/callback", params={"code": "x", "state": state_microsoft}).status_code == 400

    def test_la_url_de_login_lleva_un_state_firmado(self, client, monkeypatch):
        from app.routes import oauth_routes
        monkeypatch.setitem(oauth_routes.PROVIDERS["google"], "client_id", "id-de-prueba")
        url = client.get("/auth/google").json()["auth_url"]
        assert url.startswith("https://accounts.google.com/")
        state = url.split("state=")[1].split("&")[0]
        oauth_routes._check_state(state, "google")  # no lanza
