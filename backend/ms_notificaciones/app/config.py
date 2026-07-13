from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Ya no hay configuración de correos aquí
    MQTT_BROKER_HOST: str = "mqtt-broker"
    MQTT_BROKER_PORT: int = 1883
    DATABASE_URL: str = "postgresql://postgres_admin:postgres123456@db:5432/db_notificaciones"
    
    class Config:
        env_file = ".env"

settings = Settings()
