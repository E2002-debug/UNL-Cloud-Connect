# Autor: David Guamán
# Fecha: 29/05/2026
# Version: 1.0 (Módulo de seguridad y validación JWT para Telemetría)

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from app.core.config import settings

# Le indicamos a FastAPI (y a Swagger UI) a dónde debe ir el usuario a pedir su token.
# Fíjate que apunta al puerto 8001 (tu microservicio de usuarios)
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
        # Usa la misma SECRET_KEY que tiene ms_gestion_usuarios en su .env
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credenciales_exception
            
        # Retornamos los datos del usuario que venían dentro del token
        return payload 
        
    except JWTError:
        raise credenciales_exception