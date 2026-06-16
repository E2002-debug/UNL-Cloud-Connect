from pydantic import BaseModel, Field, ConfigDict, model_validator
from datetime import datetime
from typing import Optional
from app.models.evento import ProgresoEvento
from app.schemas.ubicacion import UbicacionResponse

# Esquema base con la información central del evento
class EventoBase(BaseModel):
    nombre: str = Field(..., min_length=5, max_length=150, description="Título del evento académico o actividad")
    descripcion: str = Field(..., min_length=10, max_length=500, description="Detalles completos de la actividad")
    fecha_hora_inicio: datetime = Field(..., description="Fecha y hora de inicio")
    fecha_hora_final: datetime = Field(..., description="Fecha y hora de finalización prevista")

    # Validación estricta: El evento no puede terminar antes de empezar
    @model_validator(mode='after')
    def validar_fechas(self) -> 'EventoBase':
        if self.fecha_hora_final <= self.fecha_hora_inicio:
            raise ValueError("La fecha de finalización debe ser posterior a la fecha de inicio.")
        return self

# Paso 2.2: Esquema para crear un evento
class EventoCreate(EventoBase):
    id_ubicacion: int = Field(..., description="ID de la ubicación previamente registrada")
    # ELIMINADO: id_usuario. FastAPI lo inyectará en el endpoint sacándolo del JWT.

# Paso 2.2: Esquema para actualizar un evento existente
class EventoUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=5, max_length=150)
    descripcion: Optional[str] = Field(None, min_length=10, max_length=500)
    fecha_hora_inicio: Optional[datetime] = None
    fecha_hora_final: Optional[datetime] = None
    estado: Optional[ProgresoEvento] = Field(None, description="Nuevo estado del evento")
    id_ubicacion: Optional[int] = None

    # Validación opcional para el update
    @model_validator(mode='after')
    def validar_fechas_update(self) -> 'EventoUpdate':
        if self.fecha_hora_inicio and self.fecha_hora_final:
            if self.fecha_hora_final <= self.fecha_hora_inicio:
                raise ValueError("La fecha de finalización debe ser posterior a la fecha de inicio.")
        return self

# Paso 2.3: Esquema para responder al Frontend
class EventoResponse(EventoBase):
    id_evento: int
    estado: ProgresoEvento
    id_usuario: int 
    ubicacion: UbicacionResponse
    imagen_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)