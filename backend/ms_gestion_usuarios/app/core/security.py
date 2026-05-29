# Autor: David Guamán
# Fecha: 20/05/2026
# Version: 0.1
# Historial:
# 20/05/2026 v0.1 - David Guamán: Implementación de encriptación de claves con bcrypt, generación de tokens JWT y configuración de CORS.

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from typing import Any
from jose import jwt

# Importamos las configuraciones centralizadas
from backend.ms_gestion_usuarios.app.core.config import settings
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

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

def verificar_y_extraer_token_google(google_token: str) -> dict:
    """
    Valida criptográficamente el token usando la librería oficial de Google
    y extrae los datos del usuario.
    """
    try:
        # Aquí es donde leemos el ID que está guardado en tu .env a través de settings
        idinfo = id_token.verify_oauth2_token(
            google_token, 
            google_requests.Request(), 
            settings.GOOGLE_CLIENT_ID 
        )
        
        correo = idinfo.get("email")
        
        # Validación estricta del dominio UNL
        if not correo or not correo.endswith("@unl.edu.ec"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Debes usar tu correo institucional estrictamente (@unl.edu.ec)."
            )
            
        return {
            "correo": correo,
            "nombre": idinfo.get("given_name", ""),
            "apellido": idinfo.get("family_name", "")
        }
    except ValueError:
        # Si Google dice que el token es falso, expiró, o no coincide con tu Client ID
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="El token de Google es inválido o ha expirado."
        )