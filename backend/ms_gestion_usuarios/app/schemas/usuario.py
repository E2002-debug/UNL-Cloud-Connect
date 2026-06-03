# Autor: David Guamán
# Fecha: 30/05/2026
# Version: 0.2
# Historial:
# 20/05/2026 v0.1 - David Guamán: Creación de esquemas Pydantic (UsuarioCreate, UsuarioResponse, Token) y validación estricta para el dominio @unl.edu.ec.
# 22/05/2026 v0.2    - David Guamán: Adición de esquemas específicos para el flujo híbrido de registro e inicio de sesión con Google (UsuarioRegistroHibrido, TokenGoogleLogin).
# 30/05/2026 v0.3    - David Guamán: Inclusión de esquemas para la recuperación de contraseña (EmailRequest, ResetPasswordRequest) y validación de longitud mínima para la nueva contraseña.
from pydantic import BaseModel, EmailStr, field_validator, Field
from typing import Optional
from datetime import date
from pydantic import BaseModel

# Esquema base con los datos comunes
class UsuarioBase(BaseModel):
    nombre: str
    apellido: str
    correo: EmailStr
    fecha_nacimiento: Optional[date] = None

# Esquema para cuando el usuario envía datos para registrarse
class UsuarioCreate(UsuarioBase):
    clave: Optional[str] = None # Opcional por el flujo híbrido de Google
    id_rol: int

    @field_validator('correo')
    @classmethod
    def validar_correo_unl(cls, v: str) -> str:
        if not v.endswith('@unl.edu.ec'):
            raise ValueError('El correo debe pertenecer al dominio institucional @unl.edu.ec')
        return v

    @field_validator('id_rol')
    @classmethod
    def validar_rol(cls, v: int) -> int:
        if v not in [1, 2]:
            raise ValueError('El rol debe ser 1 (Administrador) o 2 (Participante)')
        return v

# Esquema para responderle al frontend (ocultando la clave)
class UsuarioResponse(UsuarioBase):
    id_usuario: int
    id_rol: int

    class Config:
        from_attributes = True # Permite a Pydantic leer los modelos de SQLAlchemy

# Esquema para el flujo de Registro Híbrido (HU_01)
class UsuarioRegistroHibrido(BaseModel):
    google_token: str       # Token que React/React Native obtienen de Google
    fecha_nacimiento: date  # Campo manual obligatorio
    clave: str = Field(..., min_length=8, description="Debe tener al menos 8 caracteres")
    id_rol: int             # Rol seleccionado (1: Administrador, 2: Participante)

    @field_validator('id_rol')
    @classmethod
    def validar_rol(cls, v: int) -> int:
        if v not in [1, 2]:
            raise ValueError('El rol debe ser 1 (Administrador) o 2 (Participante)')
        return v

# Esquema para el Inicio de Sesión Dual con Google (HU_02)
class TokenGoogleLogin(BaseModel):
    google_token: str       # Token de Google para verificar sesión directa


class UsuarioGoogleData(BaseModel):
    correo: EmailStr
    nombre: str
    apellido: str


class Token(BaseModel):
    access_token: str
    token_type: str

class EmailRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    nueva_password: str

class LoginRequest(BaseModel):
    """Esquema para request de login (desde JSON, no form-data)"""
    username: str  # correo
    password: str  # contraseña

class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    id_rol: Optional[int] = None

    @field_validator('id_rol')
    @classmethod
    def validar_rol(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v not in [1, 2]:
            raise ValueError('El rol debe ser 1 (Administrador) o 2 (Participante)')
        return v