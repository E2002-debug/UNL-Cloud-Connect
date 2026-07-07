from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Ya no hay configuración de correos aquí
    MQTT_BROKER_HOST: str = "mqtt-broker"
    MQTT_BROKER_PORT: int = 1883
    
    class Config:
        env_file = ".env"

settings = Settings()
