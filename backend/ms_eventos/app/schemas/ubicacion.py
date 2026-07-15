from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

# Esquema base con los datos comunes de la ubicación
class UbicacionBase(BaseModel):
    latitud: float = Field(..., description="Coordenada de latitud en el mapa")
    longitud: float = Field(..., description="Coordenada de longitud en el mapa")
    nombre_lugar: str = Field(..., min_length=3, max_length=150, description="Nombre descriptivo del lugar (ej. Canchas FEIRNNR)")
    direccion_alfa_numerica: Optional[str] = Field(None, max_length=255, description="Referencia adicional de la ubicación")

# Esquema para registrar una nueva ubicación desde el Frontend
class UbicacionCreate(UbicacionBase):
    pass

# Esquema para actualizar una ubicación (todos los campos son opcionales)
class UbicacionUpdate(BaseModel):
    latitud: Optional[float] = Field(None, description="Coordenada de latitud en el mapa")
    longitud: Optional[float] = Field(None, description="Coordenada de longitud en el mapa")
    nombre_lugar: Optional[str] = Field(None, min_length=3, max_length=150, description="Nombre descriptivo del lugar")
    direccion_alfa_numerica: Optional[str] = Field(None, max_length=255, description="Referencia adicional de la ubicación")

# Esquema para responder al frontend
class UbicacionResponse(UbicacionBase):
    id_ubicacion: int
    id_usuario_creador: int
    id_rol_creador: int
    activo: bool = True

    # Permite a Pydantic leer directamente el objeto de SQLAlchemy
    model_config = ConfigDict(from_attributes=True)