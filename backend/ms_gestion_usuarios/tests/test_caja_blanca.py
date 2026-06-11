import pytest
from datetime import timedelta
from jose import jwt
from app.core.security import (
    obtener_hash_clave,
    verificar_clave,
    crear_token_acceso,
    crear_token_recuperacion,
    verificar_token_recuperacion
)
from app.core.config import settings

def test_encriptacion_clave():
    """
    Test de Caja Blanca: Verifica la lógica interna del motor de encriptación bcrypt.
    Se asegura de que el hash generado sea distinto a la clave original y 
    que la verificación funcione correctamente.
    """
    clave_original = "SuperSecreta123"
    hash_generado = obtener_hash_clave(clave_original)
    
    assert hash_generado != clave_original
    assert verificar_clave(clave_original, hash_generado) == True
    assert verificar_clave("ClaveEquivocada", hash_generado) == False

def test_generacion_token_acceso():
    """
    Test de Caja Blanca: Verifica que la función interna crear_token_acceso 
    genere un JWT válido con el payload correcto (sub y exp).
    """
    correo_prueba = "test@unl.edu.ec"
    token = crear_token_acceso(sujeto=correo_prueba, tiempo_expiracion=timedelta(minutes=10))
    
    assert isinstance(token, str)
    
    # Decodificamos el token para inspeccionar su estructura interna
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert payload.get("sub") == correo_prueba
    assert "exp" in payload

def test_token_recuperacion():
    """
    Test de Caja Blanca: Verifica el flujo interno completo de generación y 
    verificación de tokens de recuperación (incluyendo la etiqueta de tipo 'reset').
    """
    correo_prueba = "recuperar@unl.edu.ec"
    token = crear_token_recuperacion(email=correo_prueba)
    
    # 1. El token válido debe retornar el correo
    correo_extraido = verificar_token_recuperacion(token)
    assert correo_extraido == correo_prueba
    
    # 2. Un token de acceso normal no debería funcionar como token de recuperación
    token_normal = crear_token_acceso(sujeto=correo_prueba)
    correo_invalido = verificar_token_recuperacion(token_normal)
    assert correo_invalido is None # Debe ser rechazado porque no tiene type="reset"
