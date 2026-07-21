from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.schemas.auditoria import AuditoriaResponse
from app.crud.crud_auditoria import obtener_auditoria
from app.core.deps import get_current_user

router = APIRouter(
    prefix="/usuarios/auditoria",
    tags=["Auditoría de Usuarios"]
)

@router.get("/", response_model=List[AuditoriaResponse])
def listar_auditoria(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Only superadmin (id_rol = 3) can access this, wait I'll allow admins (id_rol = 1) too if they want
    if str(current_user.id_rol) not in ["1", "3"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver el monitoreo."
        )
    return obtener_auditoria(db, skip=skip, limit=limit)
