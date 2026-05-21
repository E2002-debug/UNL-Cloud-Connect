from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from typing import Any
from jose import jwt

# Importamos las configuraciones centralizadas
from app.core.config import settings

# Configuramos bcrypt como el único algoritmo de hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def setup_cors(app: FastAPI) -> None:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

def verificar_clave(clave_plana: str, clave_hasheada: str) -> bool:
    return pwd_context.verify(clave_plana, clave_hasheada)

def obtener_hash_clave(clave: str) -> str:
    return pwd_context.hash(clave)

def crear_token_acceso(sujeto: Any, tiempo_expiracion: timedelta = None) -> str:
    """
    Genera un token JWT firmado para el usuario autenticado.
    """
    # Usamos timezone.utc para compatibilidad estricta con Python 3.12+
    if tiempo_expiracion:
        expire = datetime.now(timezone.utc) + tiempo_expiracion
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # "sub" (Subject) es a quién le pertenece el token (normalmente el ID o correo del usuario)
    to_encode = {"exp": expire, "sub": str(sujeto)}
    
    # Firmamos el token usando los secretos de config.py
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt