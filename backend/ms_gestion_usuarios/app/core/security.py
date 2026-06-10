# Autor: David Guamán
# Fecha: 30/05/2026
# Version: 0.2
# Historial:
# 20/05/2026 v0.1 - David Guamán: Implementación de encriptación de claves con bcrypt, generación de tokens JWT y configuración de CORS.
# 30/05/2026 v0.2 - David Guamán: Adición de funciones para generar y verificar tokens de recuperación de contraseña, y validación de tokens de Google.

from fastapi import FastAPI, HTTPException, status
from app.core.config import settings
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from typing import Any
from jose import jwt, JWTError

# Importamos las configuraciones centralizadas
# Definimos que el token de recuperación caduca muy rápido por seguridad
RESET_TOKEN_EXPIRE_MINUTES = 15
VERIFICATION_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 horas para verificar correo
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
        
        correo = idinfo.get("email", "").lower().strip()
        
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
    except HTTPException:
        # Re-raise HTTPExceptions sin modificarlas
        raise
    except ValueError as e:
        # Si Google dice que el token es falso, expiró, o no coincide con tu Client ID
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"El token de Google es inválido o ha expirado. Detalles: {str(e)}"
        )
    except Exception as e:
        # Catch any other unexpected errors (sin exponer detalles técnicos)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al validar el token de Google. Intente nuevamente."
        )
    

def crear_token_recuperacion(email: str) -> str:
    """
    Genera un JWT de vida corta exclusivo para recuperar contraseñas.
    """
    expire = datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "sub": email,
        "type": "reset",  # Etiqueta de seguridad crucial
        "exp": expire
    }
    
    # Usamos la misma clave secreta de tu .env
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verificar_token_recuperacion(token: str) -> str | None:
    """
    Desencripta el token. Devuelve el correo si es válido y no ha expirado.
    Devuelve None si es falso, expiró, o no es de tipo 'reset'.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        # Si alguien intenta usar un token de login aquí, lo rechazamos
        if payload.get("type") != "reset":
            return None
            
        return payload.get("sub")
    except JWTError:
        return None


def crear_token_verificacion(email: str) -> str:
    """
    Genera un JWT de vida media (24h) exclusivo para verificar el correo electrónico.
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=VERIFICATION_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "sub": email,
        "type": "verify",  # Etiqueta de seguridad para diferenciar de otros tokens
        "exp": expire
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verificar_token_verificacion(token: str) -> str | None:
    """
    Desencripta el token de verificación de correo.
    Devuelve el correo si es válido y no ha expirado.
    Devuelve None si es falso, expiró, o no es de tipo 'verify'.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "verify":
            return None
        return payload.get("sub")
    except JWTError:
        return None

def crear_token_verificacion_datos(user_data: dict) -> str:
    """
    Genera un JWT de verificación que contiene los datos completos de registro.
    Así no se guarda el usuario en BD hasta verificar el correo.
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=VERIFICATION_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "sub": user_data["correo"],
        "user_data": user_data,
        "type": "verify_and_create",
        "exp": expire
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def verificar_token_verificacion_datos(token: str) -> dict | None:
    """
    Desencripta el token y extrae los datos de registro del usuario.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "verify_and_create":
            return None
        return payload.get("user_data")
    except JWTError:
        return None