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
    # IMPORTANTE: SECRET_KEY debe definirse en el archivo .env. Nunca uses un valor por defecto.
    SECRET_KEY = os.getenv("SECRET_KEY")
    if not SECRET_KEY:
        raise RuntimeError("⛔ FATAL: La variable de entorno SECRET_KEY no está definida. El servidor no puede arrancar de forma segura.")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 día de duración

    # Variable necesaria para validar la sesión de Google
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")

# Instanciamos la clase para que el resto de archivos la puedan importar
settings = Settings()