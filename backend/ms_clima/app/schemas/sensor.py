from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional

class SensorCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100)
    topico_mqtt: str = Field(..., min_length=1, max_length=200)
    id_ubicacion: Optional[int] = Field(default=None, ge=1)
    tipo: str = Field(default="DHT22", max_length=50)
    bateria: Optional[float] = Field(default=None, ge=0, le=100)
    firmware_version: Optional[str] = Field(default=None, max_length=50)

class SensorUpdate(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=1, max_length=100)
    topico_mqtt: Optional[str] = Field(default=None, min_length=1, max_length=200)
    id_ubicacion: Optional[int] = Field(default=None, ge=1)
    tipo: Optional[str] = Field(default=None, max_length=50)
    bateria: Optional[float] = Field(default=None, ge=0, le=100)
    firmware_version: Optional[str] = Field(default=None, max_length=50)
    estado: Optional[str] = Field(default=None, max_length=20)

class SensorResponse(BaseModel):
    id_sensor: int
    nombre: str
    topico_mqtt: str
    id_ubicacion: Optional[int] = None
    estado: str
    bateria: Optional[float] = None
    tipo: str
    ultima_conexion: Optional[datetime] = None
    firmware_version: Optional[str] = None
    activo: bool
    fecha_creacion: datetime

    model_config = ConfigDict(from_attributes=True)
