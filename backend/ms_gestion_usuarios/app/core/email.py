# Autor: David Guamán
# Fecha: 03/06/2026
# Version: 0.2
# Historial:
# 30/05/2026 v0.1 - David Guamán: Adición de variables de configuración para el servicio de correo (SMTP) y validación de tipos para booleanos.
# 03/06/2026 v0.2 - David Guamán: Adición de función de envío de correo de verificación de cuenta. Eliminación de prints que exponían datos sensibles.

from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from app.core.config import settings
import time
import logging

# Usar logging en lugar de print para no exponer datos en consola
logger = logging.getLogger(__name__)

# 1. Configuramos el cartero con las variables de tu .env
conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

async def enviar_correo_verificacion(email_destino: str, token: str):
    """
    Envía un correo de verificación de cuenta al usuario recién registrado.
    """
    frontend_url = settings.FRONTEND_URL
    url_verificacion = f"{frontend_url}/verificar-cuenta?token={token}"

    # Ocultar parcialmente el correo para mayor seguridad en logs
    partes = email_destino.split("@")
    correo_oculto = partes[0][:2] + "***@" + partes[1] if len(partes) == 2 else "***"

    html = f"""
    <div style="font-family: Arial, sans-serif; text-align: center; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1a56c9 0%, #103783 100%); padding: 30px; border-radius: 12px 12px 0 0;">
            <h2 style="color: #fff; margin: 0;">UNL Cloud Connect</h2>
            <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0 0;">Verificación de Cuenta</p>
        </div>
        <div style="background: #fff; padding: 40px 30px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="font-size: 16px; color: #1a1a1a;">¡Bienvenido al ecosistema UNL!</p>
            <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
                Para activar tu cuenta y comenzar a usar la plataforma, por favor confirma tu correo electrónico haciendo clic en el siguiente botón:
            </p>
            <br>
            <a href="{url_verificacion}" style="background-color: #103783; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 15px;">
                ✓ Verificar mi cuenta
            </a>
            <br><br>
            <p style="color: #9ca3af; font-size: 12px;">Este enlace es seguro y caducará en 24 horas.</p>
            <p style="color: #9ca3af; font-size: 12px;">Si no creaste esta cuenta, puedes ignorar este correo.</p>
        </div>
        <div style="background: #f8fafc; padding: 16px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="color: #94a3b8; font-size: 10px; margin: 0;">Proyecto de Fin de Ciclo - FEIRNNR - Universidad Nacional de Loja</p>
        </div>
    </div>
    """

    message = MessageSchema(
        subject=f"Verifica tu cuenta - UNL Cloud Connect ({int(time.time())})",
        recipients=[email_destino],
        body=html,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        logger.info(f"Correo de verificación enviado a {correo_oculto}")
    except Exception as e:
        logger.error(f"Error al enviar correo de verificación a {correo_oculto}: tipo={type(e).__name__}")


async def enviar_correo_recuperacion(email_destino: str, token: str):
    """
    Construye un correo HTML bonito y lo envía usando fastapi-mail.
    """
    # La URL del frontend se lee de la variable de entorno FRONTEND_URL
    frontend_url = settings.FRONTEND_URL
    url_recuperacion = f"{frontend_url}/reset-password?token={token}"

    # Ocultar parcialmente el correo para mayor seguridad en logs
    partes = email_destino.split("@")
    correo_oculto = partes[0][:2] + "***@" + partes[1] if len(partes) == 2 else "***"

    # Una plantilla HTML con estilo para que se vea profesional
    html = f"""
    <div style="font-family: Arial, sans-serif; text-align: center; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1a56c9 0%, #103783 100%); padding: 30px; border-radius: 12px 12px 0 0;">
            <h2 style="color: #fff; margin: 0;">UNL Cloud Connect</h2>
            <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0 0;">Recuperación de Contraseña</p>
        </div>
        <div style="background: #fff; padding: 40px 30px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
                Has solicitado restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva:
            </p>
            <br>
            <a href="{url_recuperacion}" style="background-color: #103783; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 15px;">
                Restablecer mi Contraseña
            </a>
            <br><br>
            <p style="color: #9ca3af; font-size: 12px;">Este enlace es seguro y caducará en 15 minutos.</p>
            <p style="color: #9ca3af; font-size: 12px;">Si no fuiste tú quien solicitó este cambio, puedes ignorar este correo.</p>
        </div>
        <div style="background: #f8fafc; padding: 16px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="color: #94a3b8; font-size: 10px; margin: 0;">Proyecto de Fin de Ciclo - FEIRNNR - Universidad Nacional de Loja</p>
        </div>
    </div>
    """

    message = MessageSchema(
        subject=f"Recuperación de Contraseña - UNL Cloud Connect ({int(time.time())})",
        recipients=[email_destino],
        body=html,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        logger.info(f"Correo de recuperación enviado a {correo_oculto}")
    except Exception as e:
        logger.error(f"Error al enviar correo de recuperación a {correo_oculto}: tipo={type(e).__name__}")