# Autor: David Guamán
# Fecha: 03/06/2026
# Version: 0.4.0 (Validación de Contraseñas y Mensajes de Éxito)

import re
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Any
from app.database.session import get_db
from app.schemas.usuario import EmailRequest, UsuarioCreate, UsuarioResponse, Token, UsuarioRegistroHibrido, TokenGoogleLogin, ResetPasswordRequest, UsuarioGoogleData, LoginRequest
from app.crud import crud_usuario
from app.core import security
from app.core.security import crear_token_recuperacion, verificar_token_recuperacion, obtener_hash_clave
from app.core.email import enviar_correo_recuperacion

router = APIRouter(
    prefix="/auth",
    tags=["Autenticación"]
)

def validar_fortaleza_contrasena(password: str):
    """
    Función utilitaria para validar que la contraseña cumpla con requisitos mínimos:
    - Al menos 8 caracteres
    - Al menos una letra mayúscula
    - Al menos una letra minúscula
    - Al menos un número o carácter especial
    """
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe tener al menos 8 caracteres."
        )
    if not re.search(r"[A-Z]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe incluir al menos una letra mayúscula."
        )
    if not re.search(r"[a-z]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe incluir al menos una letra minúscula."
        )
    if not re.search(r"[0-9]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe incluir al menos un número."
        )

@router.post("/registro", status_code=status.HTTP_201_CREATED)
def registrar_usuario(usuario_in: UsuarioCreate, db: Session = Depends(get_db)) -> Any:
    """
    Registra un nuevo usuario institucional (HU_01).
    Valida la fortaleza de la contraseña y retorna un mensaje de éxito explícito.
    """
    # 1. Validar fortaleza de contraseña
    validar_fortaleza_contrasena(usuario_in.clave)

    # 2. Validar duplicados
    usuario_existente = crud_usuario.obtener_usuario_por_correo(db, correo=usuario_in.correo)
    if usuario_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta cuenta ya está registrada en UNL-Cloud-Connect. Por favor, inicie sesión."
        )
    
    nuevo_usuario = crud_usuario.crear_usuario(db, usuario=usuario_in)
    
    # 3. Retorno responsivo con mensaje de éxito para el Frontend
    return {
        "success": True,
        "mensaje": f"¡Registro exitoso! Bienvenido/a {nuevo_usuario.nombre}. Ya puede iniciar sesión.",
        "usuario": {
            "id": nuevo_usuario.id,
            "correo": nuevo_usuario.correo,
            "nombre": nuevo_usuario.nombre,
            "apellido": nuevo_usuario.apellido
        }
    }


@router.post("/login", response_model=Any)
def iniciar_sesion(credenciales: LoginRequest, db: Session = Depends(get_db)) -> Any:
    """
    Inicio de sesión manual (HU_02).
    """
    usuario = crud_usuario.obtener_usuario_por_correo(db, correo=credenciales.username)
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo institucional o contraseña incorrectos.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not usuario.clave:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta cuenta está vinculada a Google. Utilice el inicio de sesión con Google."
        )
    
    if not security.verificar_clave(credenciales.password, usuario.clave):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo institucional o contraseña incorrectos.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    token_acceso = security.crear_token_acceso(sujeto=usuario.correo)
    
    return {
        "success": True,
        "mensaje": "Inicio de sesión correcto.",
        "access_token": token_acceso,
        "token_type": "bearer",
        "id_rol": usuario.id_rol,
        "nombre": usuario.nombre,
        "apellido": usuario.apellido,
        "correo": usuario.correo
    }


@router.post("/google-register", response_model=UsuarioGoogleData)
def validar_registro_google(credenciales: TokenGoogleLogin, db: Session = Depends(get_db)) -> Any:
    """
    Valida el token de Google y devuelve los datos extraídos para el registro.
    """
    datos_google = security.verificar_y_extraer_token_google(credenciales.google_token)
    usuario_existente = crud_usuario.obtener_usuario_por_correo(db, correo=datos_google["correo"])
    if usuario_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta cuenta ya está registrada. Por favor, inicie sesión."
        )
    return datos_google


@router.post("/registro-hibrido", status_code=status.HTTP_201_CREATED)
def registrar_usuario_hibrido(data_in: UsuarioRegistroHibrido, db: Session = Depends(get_db)) -> Any:
    """
    Caso de Uso: Registrar cuenta (Flujo Híbrido) - HU_01.
    Valida la contraseña elegida en el flujo de Google.
    """
    # 1. Validar fortaleza de la contraseña ingresada en el formulario híbrido
    validar_fortaleza_contrasena(data_in.clave)

    # 2. Validar Token de Google
    datos_google = security.verificar_y_extraer_token_google(data_in.google_token)
    
    usuario_existente = crud_usuario.obtener_usuario_por_correo(db, correo=datos_google["correo"])
    if usuario_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta cuenta ya está registrada, por favor inicie sesión."
        )

    usuario_create = UsuarioCreate(
        nombre=datos_google["nombre"],
        apellido=datos_google["apellido"],
        correo=datos_google["correo"],
        clave=data_in.clave,
        fecha_nacimiento=data_in.fecha_nacimiento,
        id_rol=data_in.id_rol
    )
    
    nuevo_usuario = crud_usuario.crear_usuario(db, usuario=usuario_create)
    
    return {
        "success": True,
        "mensaje": "Cuenta vinculada con Google y registrada exitosamente en UNL Cloud.",
        "usuario": {
            "correo": nuevo_usuario.correo,
            "nombre": nuevo_usuario.nombre
        }
    }


@router.post("/google", response_model=Any)
def iniciar_sesion_google_alias(credenciales: TokenGoogleLogin, db: Session = Depends(get_db)) -> Any:
    return iniciar_sesion_google(credenciales, db)


@router.post("/login-google", response_model=Any)
def iniciar_sesion_google(credenciales: TokenGoogleLogin, db: Session = Depends(get_db)) -> Any:
    """
    Caso de Uso: Iniciar Sesión (Flujo Alternativo Google SSO) - HU_02.
    """
    datos_google = security.verificar_y_extraer_token_google(credenciales.google_token)
    usuario = crud_usuario.obtener_usuario_por_correo(db, correo=datos_google["correo"])
    
    if not usuario:
        usuario_create = UsuarioCreate(
            nombre=datos_google["nombre"],
            apellido=datos_google["apellido"],
            correo=datos_google["correo"],
            id_rol=2
        )
        usuario = crud_usuario.crear_usuario(db, usuario=usuario_create)
        
    token_acceso = security.crear_token_acceso(sujeto=usuario.correo)
    
    return {
        "success": True,
        "mensaje": "Autenticación por Google exitosa.",
        "access_token": token_acceso,
        "token_type": "bearer",
        "id_rol": usuario.id_rol,
        "nombre": usuario.nombre,
        "apellido": usuario.apellido,
        "correo": usuario.correo
    }


@router.post("/solicitar-recuperacion")
async def solicitar_recuperacion(request: EmailRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    usuario = crud_usuario.obtener_usuario_por_correo(db, correo=request.email)
    
    if usuario:
        token = crear_token_recuperacion(email=request.email)
        background_tasks.add_task(enviar_correo_recuperacion, request.email, token)

    return {
        "success": True,
        "mensaje": "Si el correo está registrado, hemos enviado un enlace de recuperación a tu bandeja de entrada."
    }


@router.post("/restablecer-clave")
def ejecutar_restablecer_clave(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Valida la nueva contraseña antes de actualizarla en la base de datos.
    """
    # 1. Validar la fortaleza de la nueva contraseña
    validar_fortaleza_contrasena(request.nueva_password)

    # 2. Verificar el token de recuperación
    email = verificar_token_recuperacion(request.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="El enlace es inválido o ha caducado. Solicita uno nuevo."
        )

    usuario = crud_usuario.obtener_usuario_por_correo(db, correo=email)
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")

    usuario.clave = obtener_hash_clave(request.nueva_password)
    db.commit()

    return {
        "success": True,
        "mensaje": "Contraseña actualizada exitosamente. Ya puedes iniciar sesión con tu nueva clave."
    }