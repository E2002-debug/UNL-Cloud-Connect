# app/security.py
# V-N9 Fix: Módulo de seguridad para validar tokens JWT en ms_notificaciones
# Evita que atacantes consuman los endpoints de push de forma pública.

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from .config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def validar_token(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Desencripta y valida el token JWT. 
    Retorna el payload si es válido, de lo contrario lanza 401.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas o token expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("sub") is None:
            raise credentials_exception
        return payload
    except JWTError:
        raise credentials_exception

def get_current_admin(payload: dict = Depends(validar_token)) -> dict:
    """Valida que el token pertenezca a un administrador."""
    # id_rol 1 = Admin, 3 = Superadmin
    if str(payload.get("id_rol")) not in ["1", "3"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de administrador."
        )
    return payload
