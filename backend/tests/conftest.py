"""
Fixtures de las pruebas del backend.

Las variables de entorno se fijan ANTES de importar la app: database.py, auth/utils.py y
oauth_routes.py las leen al importarse. Cada prueba usa su propia base SQLite en memoria.
"""
import importlib
import io
import os

os.environ["SECRET_KEY"] = "clave-solo-para-pruebas"
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["FRONTEND_URL"] = "http://localhost:3000"
os.environ["BACKEND_URL"] = "http://localhost:8000"
# Vacías (no borradas): load_dotenv() no pisa lo ya definido, así un backend/.env local no filtra
# credenciales reales a las pruebas.
for var in ("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "MICROSOFT_CLIENT_ID", "MICROSOFT_CLIENT_SECRET",
            "RESEND_API_KEY", "OCR_SPACE_API_KEY"):
    os.environ[var] = ""

import pytest
from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app


@pytest.fixture()
def client():
    # StaticPool: una única conexión, para que la base en memoria sea la misma en toda la prueba
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db():
        db = Session()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
    engine.dispose()


def register(client, username="ana", email="ana@example.com", password="secreto1"):
    return client.post("/auth/register", json={"username": username, "email": email, "password": password})


def login(client, username="ana", password="secreto1"):
    return client.post("/auth/token", data={"username": username, "password": password})


@pytest.fixture()
def auth(client):
    """Encabezados de un usuario ya registrado y con sesión iniciada."""
    assert register(client).status_code == 201
    token = login(client).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def other_auth(client):
    """Encabezados de un segundo usuario, para probar que los datos no se mezclan."""
    assert register(client, "beto", "beto@example.com").status_code == 201
    token = login(client, "beto").json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def png_bytes(size=(3000, 2000)):
    buf = io.BytesIO()
    Image.new("RGB", size, (200, 100, 50)).save(buf, "PNG")
    return buf.getvalue()


@pytest.fixture()
def sent_emails(monkeypatch):
    """Intercepta el envío del correo de recuperación y devuelve la lista de (destino, enlace)."""
    enviados = []
    # app.routes.auth es, por el __init__, el router; el módulo se obtiene con importlib
    auth_module = importlib.import_module("app.routes.auth")
    monkeypatch.setattr(auth_module, "send_password_reset_email", lambda to, url: enviados.append((to, url)))
    return enviados


@pytest.fixture()
def sin_red(monkeypatch):
    """Cualquier intento de hablar con un proveedor externo hace fallar la prueba.

    Así se distingue "rechazado por validar el state" de "llegó a llamar a Google y este lo rechazó".
    """
    oauth_routes = importlib.import_module("app.routes.oauth_routes")

    class SinRed:
        def __init__(self, *args, **kwargs):
            raise AssertionError("la prueba intentó hacer una llamada de red")

    monkeypatch.setattr(oauth_routes.httpx, "AsyncClient", SinRed)
