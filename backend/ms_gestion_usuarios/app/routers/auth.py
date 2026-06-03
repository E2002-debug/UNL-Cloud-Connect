# Autor: David Guamán
# Fecha: 03/06/2026
<<<<<<< HEAD
# Version: 0.4
# Historial:
# 20/05/2026 v0.1 - David Guamán: Creación de endpoints de registro (HU_01) y login (HU_02)con validación de credenciales y generación de tokens JWT.
# 22/05/2026 v0.2 - David Guamán: Implementación de endpoints específicos para el flujo híbrido de registro e inicio de sesión con Google, incluyendo validación de tokens de Google y manejo de casos especiales (usuarios sin contraseña manual).
# 30/05/2026 v0.3 - David Guamán: Adición de endpoints para recuperación de contraseña, incluyendo generación de tokens de recuperación y validación de los mismos al restablecer la clave.
# 03/06/2026 v0.4 - David Guamán: Implementación de verificación de correo electrónico y validación de reCAPTCHA para prevenir cuentas robot.
=======
# Version: 0.4.0 (Validación de Contraseñas y Mensajes de Éxito)
>>>>>>> origin/feature/programador_5

import re
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Any
import httpx
import re
from app.database.session import get_db
from app.schemas.usuario import EmailRequest, UsuarioCreate, UsuarioResponse, Token, UsuarioRegistroHibrido, TokenGoogleLogin, ResetPasswordRequest, UsuarioGoogleData, LoginRequest
from app.crud import crud_usuario
from app.core import security
from app.core.security import crear_token_recuperacion, verificar_token_recuperacion, obtener_hash_clave, crear_token_verificacion, verificar_token_verificacion
from app.core.email import enviar_correo_recuperacion, enviar_correo_verificacion
from app.core.config import settings

router = APIRouter(
    prefix="/auth",
    tags=["Autenticación"]
)

<<<<<<< HEAD
# ============ FUNCIONES DE VALIDACIÓN ============

def _validar_nombre_apellido(nombre: str, apellido: str):
    """Valida que nombre y apellido no contengan números."""
    if re.search(r'\d', nombre):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre no puede contener números."
        )
    if re.search(r'\d', apellido):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El apellido no puede contener números."
        )

def _validar_clave(clave: str):
    """Valida la fortaleza de la contraseña en el backend."""
    if not clave or len(clave) < 8:
=======
def validar_fortaleza_contrasena(password: str):
    """
    Función utilitaria para validar que la contraseña cumpla con requisitos mínimos:
    - Al menos 8 caracteres
    - Al menos una letra mayúscula
    - Al menos una letra minúscula
    - Al menos un número o carácter especial
    """
    if len(password) < 8:
>>>>>>> origin/feature/programador_5
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe tener al menos 8 caracteres."
        )
<<<<<<< HEAD
    if ' ' in clave:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña no puede contener espacios."
        )
    if not re.search(r'[A-Z]', clave):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe contener al menos una letra mayúscula."
        )
    if not re.search(r'[a-z]', clave):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe contener al menos una letra minúscula."
        )
    if not re.search(r'\d', clave):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe contener al menos un número."
        )
    if not re.search(r'[^a-zA-Z0-9]', clave):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe contener al menos un carácter especial."
        )
    if 'usuario' in clave.lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña no puede contener la palabra 'usuario'."
        )

def _validar_edad(fecha_nacimiento):
    """Valida que el usuario tenga al menos 18 años."""
    if fecha_nacimiento:
        from datetime import date
        hoy = date.today()
        edad = hoy.year - fecha_nacimiento.year - ((hoy.month, hoy.day) < (fecha_nacimiento.month, fecha_nacimiento.day))
        if edad < 18:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Debes tener al menos 18 años para registrarte."
            )

async def _verificar_recaptcha(token: str):
    """Verifica el token de reCAPTCHA v2 con los servidores de Google."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Se requiere completar el captcha de seguridad."
        )
    
    recaptcha_secret = settings.RECAPTCHA_SECRET_KEY
    if not recaptcha_secret:
        # Si no está configurado el reCAPTCHA, permitir el paso (entorno de desarrollo)
        return True
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://www.google.com/recaptcha/api/siteverify",
            data={
                "secret": recaptcha_secret,
                "response": token
            }
        )
        result = response.json()
    
    if not result.get("success", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verificación de captcha fallida. Intenta de nuevo."
        )
    return True


# ============ ENDPOINTS DE REGISTRO ============

@router.post("/registro", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
async def registrar_usuario(
    usuario_in: UsuarioCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
) -> Any:
    """
    Registra un nuevo usuario institucional (HU_01).
    Valida internamente que no existan correos duplicados.
    Envía correo de verificación al registrarse.
    """
    # Validaciones de seguridad
    _validar_nombre_apellido(usuario_in.nombre, usuario_in.apellido)
    if usuario_in.clave:
        _validar_clave(usuario_in.clave)
    if usuario_in.fecha_nacimiento:
        _validar_edad(usuario_in.fecha_nacimiento)
    
    # Verificar reCAPTCHA si se proporcionó
    if hasattr(usuario_in, 'recaptcha_token') and usuario_in.recaptcha_token:
        await _verificar_recaptcha(usuario_in.recaptcha_token)

=======
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
>>>>>>> origin/feature/programador_5
    usuario_existente = crud_usuario.obtener_usuario_por_correo(db, correo=usuario_in.correo)
    if usuario_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta cuenta ya está registrada en UNL-Cloud-Connect. Por favor, inicie sesión."
        )
    
    nuevo_usuario = crud_usuario.crear_usuario(db, usuario=usuario_in)
    
<<<<<<< HEAD
    # Enviar correo de verificación en segundo plano
    token_verificacion = crear_token_verificacion(usuario_in.correo)
    background_tasks.add_task(enviar_correo_verificacion, usuario_in.correo, token_verificacion)
    
    return nuevo_usuario
=======
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
>>>>>>> origin/feature/programador_5


@router.post("/verificar-cuenta")
def verificar_cuenta(token: str, db: Session = Depends(get_db)):
    """
    Verifica el correo electrónico del usuario usando el token enviado por email.
    """
    email = verificar_token_verificacion(token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El enlace de verificación es inválido o ha expirado. Solicita uno nuevo."
        )
    
    usuario = crud_usuario.obtener_usuario_por_correo(db, correo=email)
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")
    
    if usuario.verificado:
        return {"mensaje": "Tu cuenta ya estaba verificada. Puedes iniciar sesión."}
    
    usuario.verificado = True
    db.commit()
    
    return {"mensaje": "¡Cuenta verificada exitosamente! Ya puedes iniciar sesión."}


@router.post("/reenviar-verificacion")
async def reenviar_verificacion(
    request: EmailRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Reenvía el correo de verificación al usuario.
    """
    usuario = crud_usuario.obtener_usuario_por_correo(db, correo=request.email)
    
    # Truco de seguridad: respondemos igual aunque no exista
    if usuario and not usuario.verificado:
        token_verificacion = crear_token_verificacion(request.email)
        background_tasks.add_task(enviar_correo_verificacion, request.email, token_verificacion)
    
    return {"mensaje": "Si el correo está registrado y no verificado, hemos enviado un nuevo enlace de verificación."}


# ============ ENDPOINTS DE LOGIN ============

@router.post("/login", response_model=Any)
def iniciar_sesion(credenciales: LoginRequest, db: Session = Depends(get_db)) -> Any:
    """
    Inicio de sesión manual (HU_02).
<<<<<<< HEAD
    Retorna un token JWT Bearer e id_rol si las credenciales son válidas.
    Requiere que la cuenta esté verificada.
=======
>>>>>>> origin/feature/programador_5
    """
    usuario = crud_usuario.obtener_usuario_por_correo(db, correo=credenciales.username)
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo institucional o contraseña incorrectos.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
<<<<<<< HEAD
    # Verificar que la cuenta está verificada
    if not usuario.verificado:
        # Ocultar parcialmente el correo
        partes = credenciales.username.split("@")
        correo_oculto = partes[0][:2] + "***@" + partes[1] if len(partes) == 2 else "***"
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada en {correo_oculto}"
        )
    
    # Prevenir error si el usuario se registró con Google y no tiene contraseña manual
=======
>>>>>>> origin/feature/programador_5
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
    
<<<<<<< HEAD
    # Validaciones de seguridad
    _validar_clave(data_in.clave)
    _validar_edad(data_in.fecha_nacimiento)
    
    # 2. Validar que la cuenta no exista previamente en PostgreSQL
=======
>>>>>>> origin/feature/programador_5
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
    
<<<<<<< HEAD
    # 4. Persistir en la base de datos (usuario de Google se verifica automáticamente)
    nuevo_usuario = crud_usuario.crear_usuario(db, usuario=usuario_create, verificado=True)
    return nuevo_usuario
=======
    nuevo_usuario = crud_usuario.crear_usuario(db, usuario=usuario_create)
    
    return {
        "success": True,
        "mensaje": "Cuenta vinculada con Google y registrada exitosamente en UNL Cloud.",
        "usuario": {
            "correo": nuevo_usuario.correo,
            "nombre": nuevo_usuario.nombre
        }
    }
>>>>>>> origin/feature/programador_5


@router.post("/google", response_model=Any)
def iniciar_sesion_google_alias(credenciales: TokenGoogleLogin, db: Session = Depends(get_db)) -> Any:
    return iniciar_sesion_google(credenciales, db)


@router.post("/login-google", response_model=Any)
def iniciar_sesion_google(credenciales: TokenGoogleLogin, db: Session = Depends(get_db)) -> Any:
    """
    Caso de Uso: Iniciar Sesión (Flujo Alternativo Google SSO) - HU_02.
<<<<<<< HEAD
    Verifica el token de Google y otorga acceso inmediato SOLO si ya completó el registro híbrido.
    Usuarios de Google se verifican automáticamente.
=======
>>>>>>> origin/feature/programador_5
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
        usuario = crud_usuario.crear_usuario(db, usuario=usuario_create, verificado=True)
        
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


<<<<<<< HEAD
# ============ ENDPOINTS DE RECUPERACIÓN ============

=======
>>>>>>> origin/feature/programador_5
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
<<<<<<< HEAD
    '''Endpoint que el usuario visita desde el enlace del correo. Valida el token, y si es correcto, actualiza la contraseña en la base de datos.'''
    # Validar la nueva contraseña
    _validar_clave(request.nueva_password)
    
    # 1. El motor criptográfico revisa si el token es falso o expiró
=======
    """
    Valida la nueva contraseña antes de actualizarla en la base de datos.
    """
    # 1. Validar la fortaleza de la nueva contraseña
    validar_fortaleza_contrasena(request.nueva_password)

    # 2. Verificar el token de recuperación
>>>>>>> origin/feature/programador_5
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