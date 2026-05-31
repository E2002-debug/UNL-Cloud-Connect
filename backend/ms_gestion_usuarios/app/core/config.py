# Autor: David Guamán
# Fecha: 30/05/2026
# Version: 0.3
# Historial:
# 20/05/2026 v0.1 - David Guamán: Creación de la configuración base del proyecto, políticas CORS y secretos JWT.
# 22/05/2026 v0.2 - David Guamán: Integración de os.getenv() para capturar MQTT_BROKER_HOST desde Docker.
# 30/05/2026 v0.3 - David Guamán: Adición de variables de configuración para el servicio de correo (SMTP) y validación de tipos para booleanos.
import os
class Settings:
    # Información general de la API
    PROJECT_NAME: str = "UNL Cloud Connect API"
    PROJECT_VERSION: str = "1.0.0"
    MQTT_BROKER_HOST: str = os.getenv("MQTT_BROKER_HOST", "localhost")
    # --------------------------------------------------------
    # CORS: Aquí defines QUIÉN puede conectarse a tu API
    # --------------------------------------------------------
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",   # React Web (Vite/Create React App)
        "http://localhost",        # Contenedores internos
        "*"                        # (Recuerda quitar el '*' en producción)
    ]

    # --------------------------------------------------------
    # Variables para la Autenticación y Base de Datos
    # --------------------------------------------------------
    # Configuración de JWT (Se pueden mover a core/config.py si lo prefieres)
    SECRET_KEY = os.getenv("SECRET_KEY", "unl_secreto_extremadamente_seguro_123456")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 día de duración

    # Variable necesaria para validar la sesión de Google
    GOOGLE_CLIENT_ID: str = "" 

    # ==========================================
    # CONFIGURACIÓN DE CORREO - Lectura Nativa OS
    # ==========================================
    MAIL_USERNAME: str = os.getenv("MAIL_USERNAME", "no-leyo-el-env@gmail.com")
    MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD", "")
    MAIL_FROM: str = os.getenv("MAIL_FROM", "no-leyo-el-env@gmail.com")
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", 587))
    MAIL_SERVER: str = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    
    # Truco para convertir el texto de Docker a Booleano en Python
    MAIL_STARTTLS: bool = os.getenv("MAIL_STARTTLS", "True").lower() == "true"
    MAIL_SSL_TLS: bool = os.getenv("MAIL_SSL_TLS", "False").lower() == "true"

    class Config:
        # Esto le ordena a Pydantic que busque el archivo oculto en tu carpeta backend/
        env_file = ".env"
        env_file_encoding = "utf-8"    

# Instanciamos la clase para que el resto de archivos la puedan importar
settings = Settings()