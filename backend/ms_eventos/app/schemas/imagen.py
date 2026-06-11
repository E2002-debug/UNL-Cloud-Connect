from pydantic import BaseModel, ConfigDict
from typing import List
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