# Autor: David Guamán
# Fecha: 29/05/2026
# Version: 1.0 (Módulo de seguridad y validación JWT para Telemetría)

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from app.core.config import settings
from fastapi import Header

# Le indicamos a FastAPI (y a Swagger UI) a dónde debe ir el usuario a pedir su token.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="http://localhost:8001/api/v1/auth/login")

def setup_cors(app: FastAPI):
    """Configura las políticas de origen para conectar con React/App Móvil"""
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

def obtener_usuario_actual(token: str = Depends(oauth2_scheme)):
    """
    Desencripta y valida el token JWT. 
    Si el token es falso o expiró, bloquea la petición.
    """
    credenciales_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales o el token expiró",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credenciales_exception
        return payload 
    except JWTError:
        raise credenciales_exception

def get_admin_user(
    token: str = Depends(oauth2_scheme),
    x_user_role: str = Header(None, alias="x-user-role")
):
    """
    Valida JWT y verifica que el rol (del header x-user-role) sea Admin (1) o Superadmin (3).
    El header es inyectado por el frontend desde localStorage, mismo patrón que ms_eventos.
    """
    payload = obtener_usuario_actual(token)
    role = int(x_user_role) if x_user_role else None
    if role not in [1, 3]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos de administrador para esta operación."
        )
    return {**payload, "id_rol": role}