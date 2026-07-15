from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AuditoriaCreate(BaseModel):
    id_usuario: Optional[int] = None
    correo: Optional[str] = None
    accion: str
    ip_origen: Optional[str] = None
    detalles: Optional[str] = None

class AuditoriaResponse(BaseModel):
    id_log: int
    id_usuario: Optional[int]
    correo: Optional[str]
    accion: str
    fecha_hora: datetime
    ip_origen: Optional[str]
    detalles: Optional[str]

    class Config:
        from_attributes = True
