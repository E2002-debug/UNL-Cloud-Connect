# Autor: David Guamán
# Fecha: 30/05/2026
# Version: 0.4
# Historial:
# 20/05/2026 v0.1 - David Guamán: Creación de la configuración base del proyecto, políticas CORS y secretos JWT.
# 22/05/2026 v0.2 - David Guamán: Integración de os.getenv() para capturar MQTT_BROKER_HOST desde Docker.
# 30/05/2026 v0.3 - David Guamán: Adición de variables de configuración para el servicio de correo (SMTP) y validación de tipos para booleanos.
# 01/06/2026 v0.4 - David Guamán: Migración completa a BaseSettings de Pydantic para lectura automática del archivo .env en Docker.

from pydantic_settings import BaseSettings  # Si usas Pydantic v2 (FastAPI moderno)
# Si te da error la línea de arriba, usa: from pydantic import BaseSettings (Para Pydantic v1)

class Settings(BaseSettings):
    # Información general de la API
    PROJECT_NAME: str = "UNL Cloud Connect API"
    PROJECT_VERSION: str = "1.0.0"
    MQTT_BROKER_HOST: str = "localhost"

    # CORS: Aquí defines QUIÉN puede conectarse a tu API
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",   # Frontend-Web (Vite)
        "http://localhost:8000",   # Kong Gateway
        "http://localhost",        # Contenedores internos
        "http://127.0.0.1:5173",   # Loopback
        "*"                        # (Recuerda quitar el '*' en producción)
    ]

    # Variables para la Autenticación y Base de Datos
    SECRET_KEY: str = "unl_secreto_extremadamente_seguro_123456"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 día de duración
    DATABASE_URL: str  # Pydantic la jalará automáticamente del .env

    # Variable necesaria para validar la sesión de Google
    GOOGLE_CLIENT_ID: str = "" 

    # URL del frontend (para enlaces en correos de recuperación, etc.)
    FRONTEND_URL: str = "http://localhost:5173"

    # Clave secreta de reCAPTCHA v2 (se obtiene de Google reCAPTCHA Admin Console)
    RECAPTCHA_SECRET_KEY: str = ""

    # ==========================================
    # CONFIGURACIÓN DE CORREO - Pydantic Autoload
    # ==========================================
    # Al no asignarles valor por defecto o ponerles uno, Pydantic las buscará en el .env
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_FROM_NAME: str = "UNL Cloud"
    
    # Pydantic convierte automáticamente "true"/"false" del .env a booleanos reales de Python
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False

    class Config:
        # Pydantic buscará el archivo .env en la raíz donde se ejecuta el contenedor
        env_file = ".env"
        env_file_encoding = "utf-8"    
        extra = "ignore"  # Ignora variables del .env que no useis aquí

# Instanciamos la clase
settings = Settings()