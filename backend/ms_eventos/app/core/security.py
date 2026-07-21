# app/core/security.py
import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.core.config import settings

security = HTTPBearer()

def configurar_seguridad_app(app: FastAPI):
    """
    Configuración centralizada de CORS y políticas de seguridad del microservicio.
    Los orígenes permitidos se leen desde la variable BACKEND_CORS_ORIGINS (separados por coma).
    Si no está definida, solo se permite localhost:5173 (desarrollo local).
    """
    cors_origins_raw = os.getenv("BACKEND_CORS_ORIGINS", "http://localhost:5173")
    cors_origins = [o.strip() for o in cors_origins_raw.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        id_usuario = payload.get("id_usuario")
        id_rol = payload.get("id_rol")
        if id_usuario is None or id_rol is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token no contiene permisos suficientes",
            )
        return {"id_usuario": id_usuario, "id_rol": id_rol}
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
        )