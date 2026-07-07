from pydantic import BaseModel
from typing import Optional, List

class PushRequest(BaseModel):
    expo_push_token: str
    titulo: str
    mensaje: str
    datos_extra: Optional[dict] = None

class EventoNotificacionRequest(BaseModel):
    nombre_evento: str
    accion: str  # Ej: 'creado', 'cancelado'
    admin_token: Optional[str] = None
    usuarios_tokens: List[str] = []
