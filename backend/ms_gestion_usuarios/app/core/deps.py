from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.database.session import get_db
from app.crud.crud_usuario import obtener_usuario_por_correo
from app.models.usuario import Usuario
from app.core.token_blacklist import esta_revocado  # V-A3 Fix: integración de blacklist

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        correo: str = payload.get("sub")
        jti: str = payload.get("jti")
        if correo is None:
            raise credentials_exception

        # V-A3 Fix: rechazar tokens revocados (logout efectivo)
        if jti and esta_revocado(jti):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="La sesión ha sido cerrada. Por favor inicia sesión nuevamente.",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except JWTError:
        raise credentials_exception

    usuario = obtener_usuario_por_correo(db, correo=correo)
    if usuario is None:
        raise credentials_exception
    return usuario

def get_current_admin(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    if current_user.id_rol not in [1, 3]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes los permisos suficientes. Se requiere rol de Administrador."
        )
    return current_user
