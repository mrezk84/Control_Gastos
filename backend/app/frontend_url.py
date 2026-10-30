"""
URL(s) del frontend, a partir de la variable FRONTEND_URL.

FRONTEND_URL puede traer varias URLs separadas por coma (producción y previsualizaciones). Todas valen como
origen permitido por el CORS, pero los enlaces que se envían a una persona (correo de recuperación, redirección
tras el login social) deben apuntar a una sola: la primera.
"""
import os

DEFAULT_FRONTEND_URL = "http://localhost:3000"


def frontend_urls() -> list[str]:
    """Todas las URLs configuradas, sin espacios ni barra final."""
    raw = os.getenv("FRONTEND_URL") or DEFAULT_FRONTEND_URL
    urls = [u.strip().rstrip("/") for u in raw.split(",") if u.strip()]
    return urls or [DEFAULT_FRONTEND_URL]


def primary_frontend_url() -> str:
    """La URL a la que se enlaza en correos y redirecciones: la primera de la lista."""
    return frontend_urls()[0]
