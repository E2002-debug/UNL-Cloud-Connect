# Autor: David Guamán
# Fecha: 29/05/2026
# Version: 1.0 (Módulo de seguridad y validación JWT para Telemetría)

from fastapi import FastAPI, Depends, HTTPException, status
import os
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from app.core.config import settings
from fastapi import Header

# Le indicamos a FastAPI (y a Swagger UI) a dónde debe ir el usuario a pedir su token.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def setup_cors(app: FastAPI):
    """Configura las políticas de origen para conectar con React/App Móvil"""
    # Se obtienen los orígenes permitidos desde la variable de entorno BACKEND_CORS_ORIGINS
    # Para permitir múltiples orígenes, sepáralos con coma en la variable de entorno.
    cors_origins_raw = os.getenv("BACKEND_CORS_ORIGINS", "http://localhost:5173")
    cors_origins = [o.strip() for o in cors_origins_raw.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "x-user-id", "x-user-role"],
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
    x_user_role: str = Header(..., alias="x-user-role", description="Rol inyectado por Kong")
):
    """
    Valida JWT y verifica que el rol (del header x-user-role) sea Admin (1) o Superadmin (3).
    El header DEBE ser inyectado por Kong; si falta, FastAPI rechaza con 422 automáticamente.
    """
    payload = obtener_usuario_actual(token)
    if not x_user_role.isdigit():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Header x-user-role inválido o ausente."
        )
    role = int(x_user_role)
    if role not in [1, 3]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos de administrador para esta operación."
        )
    return {**payload, "id_rol": role}