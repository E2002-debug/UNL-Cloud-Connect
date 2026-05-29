
# Autor: David Guamán
# Fecha: 22/05/2026
# Version: 0.2
# Historial:
# 20/05/2026 v0.1 - David Guamán: Creación de endpoints de registro (HU_01) y login (HU_02)con validación de credenciales y generación de tokens JWT.
# 22/05/2026 v0.2 - David Guamán: Implementación de endpoints específicos para el flujo híbrido de registro e inicio de sesión con Google, incluyendo validación de tokens de Google y manejo de casos especiales (usuarios sin contraseña manual).
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Any

from backend.ms_gestion_usuarios.app.database.session import get_db
from backend.ms_gestion_usuarios.app.schemas.usuario import UsuarioCreate, UsuarioResponse, Token, UsuarioRegistroHibrido, TokenGoogleLogin
from backend.ms_gestion_usuarios.app.crud import crud_usuario
from backend.ms_gestion_usuarios.app.core import security


router = APIRouter(
    prefix="/auth",
    tags=["Autenticación"]
)

@router.post("/registro", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def registrar_usuario(usuario_in: UsuarioCreate, db: Session = Depends(get_db)) -> Any:
    """
    Registra un nuevo usuario institucional (HU_01).
    Valida internamente que no existan correos duplicados.
    """
    usuario_existente = crud_usuario.obtener_usuario_por_correo(db, correo=usuario_in.correo)
    
    if usuario_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta cuenta ya está registrada en UNL-Cloud-Connect. Por favor, inicie sesión."
        )
    
    nuevo_usuario = crud_usuario.crear_usuario(db, usuario=usuario_in)
    return nuevo_usuario


@router.post("/login", response_model=Token)
def iniciar_sesion(
    db: Session = Depends(get_db),
    credenciales: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    Inicio de sesión manual (HU_02).
    Retorna un token JWT Bearer si las credenciales son válidas.
    """
    usuario = crud_usuario.obtener_usuario_por_correo(db, correo=credenciales.username)
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo institucional o contraseña incorrectos.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # NUEVO: Prevenir error si el usuario es de Google y no tiene contraseña manual
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
        "access_token": token_acceso,
        "token_type": "bearer"
    }



@router.post("/registro-hibrido", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def registrar_usuario_hibrido(data_in: UsuarioRegistroHibrido, db: Session = Depends(get_db)) -> Any:
    """
    Caso de Uso: Registrar cuenta (Flujo Híbrido) - HU_01.
    Extrae los datos básicos de Google, valida el dominio y exige contraseña/fecha de nacimiento.
    """
    # 1. Usar el módulo de seguridad para extraer y validar el token criptográficamente
    datos_google = security.verificar_y_extraer_token_google(data_in.google_token)
    
    # 2. Validar que la cuenta no exista previamente en PostgreSQL
    usuario_existente = crud_usuario.obtener_usuario_por_correo(db, correo=datos_google["correo"])
    if usuario_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta cuenta ya está registrada, por favor inicie sesión."
        )

    # 3. Combinar datos locked (Google) con los manuales ingresados en el formulario
    usuario_create = UsuarioCreate(
        nombre=datos_google["nombre"],
        apellido=datos_google["apellido"],
        correo=datos_google["correo"],
        clave=data_in.clave, # Se encriptará en la capa CRUD
        fecha_nacimiento=data_in.fecha_nacimiento,
        id_rol=data_in.id_rol
    )
    
    # 4. Persistir en la base de datos
    nuevo_usuario = crud_usuario.crear_usuario(db, usuario=usuario_create)
    return nuevo_usuario

@router.post("/login-google", response_model=Token)
def iniciar_sesion_google(credenciales: TokenGoogleLogin, db: Session = Depends(get_db)) -> Any:
    """
    Caso de Uso: Iniciar Sesión (Flujo Alternativo Google SSO) - HU_02.
    Verifica el token de Google y otorga acceso inmediato SOLO si ya completó el registro híbrido.
    """
    # 1. Usar el módulo de seguridad para verificar la firma de Google
    datos_google = security.verificar_y_extraer_token_google(credenciales.google_token)
    
    # 2. Buscar si el usuario existe en el sistema centralizado de la UNL
    usuario = crud_usuario.obtener_usuario_por_correo(db, correo=datos_google["correo"])
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cuenta no registrada. Por favor, regístrese primero."
        )
        
    if not usuario.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta cuenta institucional se encuentra inactiva."
        )
        
    # 3. El inicio de sesión es rápido y no solicita datos extra si ya existe
    token_acceso = security.crear_token_acceso(sujeto=usuario.correo)
    
    return {
        "access_token": token_acceso,
        "token_type": "bearer"
    }