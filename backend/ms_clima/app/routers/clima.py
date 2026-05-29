# Autor: David Guamán
# Fecha: 22/05/2026
# Version: 0.1
# Historial:
# 22/05/2026 v0.1 - David Guamán: Creación del router de FastAPI para manejar las rutas relacionadas con la telemetría climática (temperatura y humedad) enviada por la ESP32,

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any

from backend.ms_clima.app.database.session import get_db
from backend.ms_clima.app.schemas.clima import ClimaResponse
from backend.ms_clima.app.crud import crud_clima
                                                            
router = APIRouter(
    prefix="/clima",
    tags=["Telemetría IoT"]
)

@router.get("/actual", response_model=ClimaResponse, status_code=status.HTTP_200_OK)
def obtener_clima_actual(db: Session = Depends(get_db)) -> Any:
    """
    Obtiene el último registro climático válido capturado.
    Utilizado por el Frontend para mostrar las condiciones en la interfaz (HU_03).
    """
    ultimo_clima = crud_clima.obtener_ultimo_clima(db)
    
    if not ultimo_clima:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay datos climáticos registrados en el sistema."
        )
        
    return ultimo_clima