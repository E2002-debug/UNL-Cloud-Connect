# Autor: David Guamán
# Fecha: 30/05/2026
# Version: 0.1
# Historial:
# 30/05/2026 v0.1 - David Guamán: Adición de variables de configuración para el servicio de correo (SMTP) y validación de tipos para booleanos.

from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from app.core.config import settings
import time
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

async def enviar_correo_recuperacion(email_destino: str, token: str):
    """
    Construye un correo HTML bonito y lo envía usando fastapi-mail.
    """
    # Esta es la URL de tu React. Cuando pases a producción, cambias localhost por tu dominio real.
    url_recuperacion = f"http://localhost:5173/reset-password?token={token}"

    # Una plantilla HTML con estilo para que se vea profesional
    html = f"""
    <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
        <h2 style="color: #004b87;">UNL Cloud Connect</h2>
        <p>Has solicitado restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva:</p>
        <br>
        <a href="{url_recuperacion}" style="background-color: #004b87; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Restablecer mi Contraseña</a>
        <br><br>
        <p style="color: #666; font-size: 12px;">Este enlace es seguro y caducará en 15 minutos.</p>
        <p style="color: #666; font-size: 12px;">Si no fuiste tú quien solicitó este cambio, puedes ignorar este correo.</p>
    </div>
    """

    message = MessageSchema(
        subject=f"Recuperación de Contraseña - Unl Cloud Connect ({int(time.time())})",
        recipients=[email_destino],
        body=html,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        print(f"Correo enviado exitosamente a {email_destino}")
    except Exception as e:
        print(f"⚠️ ERROR AL ENVIAR CORREO A {email_destino} ⚠️")
        print("La configuración SMTP de Google falló, pero para que puedas continuar con las pruebas del proyecto, aquí tienes el enlace generado:")
        print("--------------------------------------------------")
        print(f"👉 COPIA ESTE ENLACE EN TU NAVEGADOR: {url_recuperacion}")
        print("--------------------------------------------------")
        print(f"Error técnico: {e}")