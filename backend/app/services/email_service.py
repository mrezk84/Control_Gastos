"""
Envío de correos transaccionales con Resend (https://resend.com, plan gratuito: 3000/mes).

Sin RESEND_API_KEY no se envía nada: el enlace se escribe en el log, útil en desarrollo local.
"""

import logging
import os

import httpx

logger = logging.getLogger(__name__)

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
# Sin dominio verificado en Resend solo se puede enviar desde onboarding@resend.dev
# y únicamente al correo dueño de la cuenta de Resend.
EMAIL_FROM = os.getenv("EMAIL_FROM", "Control Gastos <onboarding@resend.dev>")


def send_password_reset_email(to_email: str, reset_url: str) -> bool:
    """Envía el enlace de recuperación. Devuelve True si el proveedor lo aceptó."""
    if not RESEND_API_KEY:
        logger.warning(f"RESEND_API_KEY no configurada. Enlace de recuperación para {to_email}: {reset_url}")
        return False

    html = (
        "<p>Recibimos una solicitud para restablecer tu contraseña de Control Gastos.</p>"
        f'<p><a href="{reset_url}">Elegir una contraseña nueva</a></p>'
        "<p>El enlace vence en 15 minutos. Si no fuiste vos, ignorá este correo.</p>"
    )
    try:
        resp = httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
            json={
                "from": EMAIL_FROM,
                "to": [to_email],
                "subject": "Restablecé tu contraseña",
                "html": html,
            },
            timeout=10,
        )
        resp.raise_for_status()
        return True
    except httpx.HTTPStatusError as e:
        # El cuerpo de Resend explica el motivo (p. ej. "solo puedes enviar a tu propio correo" sin dominio verificado)
        logger.error("Resend rechazó el correo (HTTP %s): %s", e.response.status_code, e.response.text[:300])
        return False
    except httpx.HTTPError as e:
        logger.error(f"No se pudo contactar con Resend: {e}")
        return False
