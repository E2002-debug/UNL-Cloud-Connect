from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class ClimaPayload(BaseModel):
    """
    Esquema para validar el JSON que llega por MQTT desde el nodo ESP32.
    """
    temperatura: float = Field(..., description="Temperatura en grados centígrados")
    humedad: float = Field(..., description="Humedad relativa en porcentaje")
    
class ClimaResponse(BaseModel):
    """
    Esquema para enviar la información climática actual al Frontend.
    """
    id_clima: int
    temperatura: float
    humedad: float
    fecha_captura: datetime
    fuente: str

    class Config:
        from_attributes = True