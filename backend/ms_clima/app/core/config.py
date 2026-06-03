# Autor: David Guamán
# Fecha: 22/05/2026
# Version: 0.2
# Historial:
# 20/05/2026 v0.1 - David Guamán: Creación de la configuración base del proyecto, políticas CORS y secretos JWT.
# 22/05/2026 v0.2 - David Guamán: Integración de os.getenv() para capturar MQTT_BROKER_HOST desde Docker.

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
        "http://localhost:5173",   # Frontend-Web (Vite)
        "http://localhost:8000",   # Kong Gateway
        "http://localhost",        # Contenedores internos
        "http://127.0.0.1:5173",   # Loopback
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
    GOOGLE_CLIENT_ID: str = "883175682519-tv0t5ndf3185sdimdjd6ro9hack12m7r.apps.googleusercontent.com"

# Instanciamos la clase para que el resto de archivos la puedan importar
settings = Settings()