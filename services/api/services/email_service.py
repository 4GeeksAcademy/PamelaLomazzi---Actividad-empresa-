from __future__ import annotations

import logging
import os

import httpx

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "HealthCore <onboarding@resend.dev>")


def send_password_reset_email(to_email: str, reset_link: str) -> None:
    """Envía el correo de restablecimiento vía Resend. Nunca lanza: un fallo de envío no debe romper el flujo."""
    api_key = os.getenv("RESEND_API_KEY", "")
    if not api_key:
        logger.warning(
            "RESEND_API_KEY no configurada; omitiendo envío de correo. Enlace: %s", reset_link
        )
        return

    html = (
        "<p>Recibimos una solicitud para restablecer tu contraseña de HealthCore.</p>"
        f'<p><a href="{reset_link}">Haz clic aquí para restablecerla</a></p>'
        "<p>Este enlace expira pronto. Si no solicitaste esto, ignora este correo.</p>"
    )

    try:
        response = httpx.post(
            RESEND_API_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "from": RESEND_FROM_EMAIL,
                "to": [to_email],
                "subject": "Restablecer tu contraseña de HealthCore",
                "html": html,
            },
            timeout=10.0,
        )
        response.raise_for_status()
    except httpx.HTTPError:
        logger.exception("Fallo al enviar el correo de restablecimiento a %s", to_email)
