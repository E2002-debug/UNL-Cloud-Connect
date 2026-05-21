
# Autor: David Guamán
# Fecha: 20/05/2026
# Version: 0.1
# Historial:
# David Guamán: Creación de endpoints de registro (HU_01) y login (HU_02)
# con validación de credenciales y generación de tokens JWT.

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Any

from app.database.session import get_db
from app.schemas.usuario import UsuarioCreate, UsuarioResponse, Token
from app.crud import crud_usuario
from app.core import security

router = APIRouter(
    prefix="/auth",
    tags=["Autenticación"]
)

@router.post("/registro", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def registrar_usuario(usuario_in: UsuarioCreate, db: Session = Depends(get_db)) -> Any:
    """
    Registra un nuevo usuario institucional (HU_01).
    Valida internamente que no existan correos duplicados.
    """
    usuario_existente = crud_usuario.obtener_usuario_por_correo(db, correo=usuario_in.correo)
    
    if usuario_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta cuenta ya está registrada en UNL-Cloud-Connect. Por favor, inicie sesión."
        )
    
    nuevo_usuario = crud_usuario.crear_usuario(db, usuario=usuario_in)
    return nuevo_usuario


@router.post("/login", response_model=Token)
def iniciar_sesion(
    db: Session = Depends(get_db),
    credenciales: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    Inicio de sesión manual (HU_02).
    Retorna un token JWT Bearer si las credenciales son válidas.
    """
    usuario = crud_usuario.obtener_usuario_por_correo(db, correo=credenciales.username)
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo institucional o contraseña incorrectos.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # NUEVO: Prevenir error si el usuario es de Google y no tiene contraseña manual
    if not usuario.clave:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta cuenta está vinculada a Google. Utilice el inicio de sesión con Google."
        )
    
    if not security.verificar_clave(credenciales.password, usuario.clave):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo institucional o contraseña incorrectos.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    token_acceso = security.crear_token_acceso(sujeto=usuario.correo)
    
    return {
        "access_token": token_acceso,
        "token_type": "bearer"
    }