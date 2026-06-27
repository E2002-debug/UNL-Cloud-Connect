from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from app.models.imagen import TipoReaccion

# Lo que envía la app móvil o web en el body
class ReaccionRequest(BaseModel):
    tipo: TipoReaccion

# Lo que le devolvemos al frontend para pintar la UI (HU_07)
class ReaccionesResumenResponse(BaseModel):
    total_me_gusta: int
    total_no_me_gusta: int
    usuarios_me_gusta: List[int]
    usuarios_no_me_gusta: List[int]
    
    model_config = ConfigDict(from_attributes=True)


class ReportarImagenRequest(BaseModel):
    motivo_reporte: str


class ImagenReportadaResponse(BaseModel):
    id_imagen: int
    url: str
    fecha_subida: datetime
    id_usuario: int
    id_evento: int
    evento_nombre: str
    motivo_reporte: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)