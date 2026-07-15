# app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Metadatos de la aplicación
    PROJECT_NAME: str = "MS-Eventos | UNL Cloud Connect"
    VERSION: str = "1.0"
    DESCRIPTION: str = "Microservicio encargado de la gestión y visualización de actividades académicas."
    
    # Base de Datos
    DATABASE_URL: str

    # ==========================================
    # CONFIGURACIÓN DE MINIO (OBJECT STORAGE)
    # ==========================================
    MINIO_SERVER: str              
    MINIO_ROOT_USER: str          
    MINIO_ROOT_PASSWORD: str      
    MINIO_BUCKET_NAME: str  
    MINIO_PUBLIC_URL: str = "http://localhost:9005"
    
    # Seguridad — V-N1 Fix: sin valor por defecto, Pydantic lanzará error al arrancar si no está en .env
    # NUNCA pongas un valor por defecto aquí. Usa: openssl rand -hex 32
    SECRET_KEY: str
    ALGORITHM: str = "HS256"

    class Config:
        case_sensitive = True
        env_file = ".env"  # Activado para que lea tu archivo seguro automáticamente

# Instanciamos la configuración para importarla en otros archivos
settings = Settings()