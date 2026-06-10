# app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Metadatos de la aplicación
    PROJECT_NAME: str = "MS-Eventos | UNL Cloud Connect"
    VERSION: str = "1.0"
    DESCRIPTION: str = "Microservicio encargado de la gestión y visualización de actividades académicas."
    
    # En el futuro, aquí puedes agregar variables de entorno puras:
    # DATABASE_URL: str
    # SECRET_KEY: str

    class Config:
        case_sensitive = True
        # env_file = ".env"  # Descomenta esto cuando uses variables de entorno

# Instanciamos la configuración para importarla en otros archivos
settings = Settings()