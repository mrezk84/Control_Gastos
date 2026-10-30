import httpx
import importlib

from app.frontend_url import frontend_urls, primary_frontend_url
from .conftest import register


class TestFrontendUrl:
    def test_una_sola_url(self, monkeypatch):
        monkeypatch.setenv("FRONTEND_URL", "https://app.example.com")
        assert frontend_urls() == ["https://app.example.com"]
        assert primary_frontend_url() == "https://app.example.com"

    def test_varias_urls_la_primera_es_la_principal(self, monkeypatch):
        monkeypatch.setenv("FRONTEND_URL", " https://app.example.com/ , https://preview.example.com ")
        assert frontend_urls() == ["https://app.example.com", "https://preview.example.com"]
        assert primary_frontend_url() == "https://app.example.com"

    def test_sin_configurar_usa_localhost(self, monkeypatch):
        monkeypatch.delenv("FRONTEND_URL", raising=False)
        assert primary_frontend_url() == "http://localhost:3000"
        monkeypatch.setenv("FRONTEND_URL", " , ")
        assert primary_frontend_url() == "http://localhost:3000"


class TestEnlaceDeRecuperacion:
    def test_con_varias_urls_el_enlace_apunta_solo_a_la_primera(self, client, sent_emails, monkeypatch):
        # Regresión: con "a,b" el enlace salía como "a,b/reset-password?token=..." (roto)
        monkeypatch.setenv("FRONTEND_URL", "https://app.example.com,https://preview.example.com")
        register(client)
        client.post("/auth/forgot-password", json={"email": "ana@example.com"})
        enlace = sent_emails[0][1]
        assert enlace.startswith("https://app.example.com/reset-password?token=")
        assert "," not in enlace and "preview" not in enlace


class TestCorreoResend:
    """send_password_reset_email con Resend simulado: ninguna llamada sale a la red."""

    @staticmethod
    def servicio(monkeypatch, api_key="re_clave_de_prueba"):
        email = importlib.import_module("app.services.email_service")
        monkeypatch.setattr(email, "RESEND_API_KEY", api_key)
        return email

    def test_sin_clave_no_llama_a_resend_y_deja_el_enlace_en_el_log(self, monkeypatch, caplog):
        email = self.servicio(monkeypatch, api_key="")
        monkeypatch.setattr(email.httpx, "post", lambda *a, **k: (_ for _ in ()).throw(AssertionError("llamó a la red")))
        with caplog.at_level("WARNING"):
            assert email.send_password_reset_email("ana@example.com", "https://x/reset?token=t") is False
        assert "https://x/reset?token=t" in caplog.text

    def test_envio_correcto(self, monkeypatch):
        email = self.servicio(monkeypatch)
        llamadas = []

        def falso_post(url, headers=None, json=None, timeout=None):
            llamadas.append((url, headers, json))
            return httpx.Response(200, json={"id": "abc"}, request=httpx.Request("POST", url))

        monkeypatch.setattr(email.httpx, "post", falso_post)
        assert email.send_password_reset_email("ana@example.com", "https://x/reset?token=t") is True
        url, headers, cuerpo = llamadas[0]
        assert url == "https://api.resend.com/emails"
        assert headers["Authorization"] == "Bearer re_clave_de_prueba"
        assert cuerpo["to"] == ["ana@example.com"]
        assert "https://x/reset?token=t" in cuerpo["html"]

    def test_rechazo_de_resend_registra_el_motivo(self, monkeypatch, caplog):
        # Sin dominio verificado, Resend responde 403 a destinatarios que no son el dueño de la cuenta
        email = self.servicio(monkeypatch)
        motivo = '{"message":"You can only send testing emails to your own email address"}'

        def rechazo(url, **k):
            return httpx.Response(403, text=motivo, request=httpx.Request("POST", url))

        monkeypatch.setattr(email.httpx, "post", rechazo)
        with caplog.at_level("ERROR"):
            assert email.send_password_reset_email("otra@example.com", "https://x/r") is False
        assert "403" in caplog.text and "testing emails" in caplog.text

    def test_fallo_de_red(self, monkeypatch, caplog):
        email = self.servicio(monkeypatch)

        def sin_red(url, **k):
            raise httpx.ConnectError("sin conexión")

        monkeypatch.setattr(email.httpx, "post", sin_red)
        with caplog.at_level("ERROR"):
            assert email.send_password_reset_email("ana@example.com", "https://x/r") is False
        assert "contactar con Resend" in caplog.text

    def test_la_clave_nunca_aparece_en_el_log(self, monkeypatch, caplog):
        email = self.servicio(monkeypatch)
        monkeypatch.setattr(email.httpx, "post", lambda url, **k: httpx.Response(401, text="invalid api key", request=httpx.Request("POST", url)))
        with caplog.at_level("DEBUG"):
            email.send_password_reset_email("ana@example.com", "https://x/r")
        assert "re_clave_de_prueba" not in caplog.text
