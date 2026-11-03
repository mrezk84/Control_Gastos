"""
URL(s) del frontend, a partir de la variable FRONTEND_URL.

FRONTEND_URL puede traer varias URLs separadas por coma (producción y previsualizaciones). Todas valen como
origen permitido por el CORS, pero los enlaces que se envían a una persona (correo de recuperación, redirección
tras el login social) deben apuntar a una sola: la primera.
"""
import os

DEFAULT_FRONTEND_URL = "http://localhost:3000"


def with_scheme(url: str) -> str:
    """Añade el esquema si falta: «mi-api.vercel.app» → «https://mi-api.vercel.app» (http en localhost).

    Una URL sin esquema hace que Google y Microsoft rechacen el redirect_uri del login social.
    """
    url = url.strip().rstrip("/")
    if not url or "://" in url:
        return url
    local = url.split("/")[0].split(":")[0] in ("localhost", "127.0.0.1", "[::1]")
    return f"{'http' if local else 'https'}://{url}"


def frontend_urls() -> list[str]:
    """Todas las URLs configuradas, sin espacios ni barra final y siempre con esquema."""
    raw = os.getenv("FRONTEND_URL") or DEFAULT_FRONTEND_URL
    urls = [with_scheme(u) for u in raw.split(",") if u.strip()]
    return urls or [DEFAULT_FRONTEND_URL]


def primary_frontend_url() -> str:
    """La URL a la que se enlaza en correos y redirecciones: la primera de la lista."""
    return frontend_urls()[0]
