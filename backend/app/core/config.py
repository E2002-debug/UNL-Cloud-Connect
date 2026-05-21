import os
class Settings:
    # Información general de la API
    PROJECT_NAME: str = "UNL Cloud Connect API"
    PROJECT_VERSION: str = "1.0.0"
    
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

# Instanciamos la clase para que el resto de archivos la puedan importar
settings = Settings()