# Autor: David Guamán
# Fecha: 20/05/2026
# Version: 0.1
# Historial:
# David Guamán: Creación de esquemas Pydantic (UsuarioCreate, UsuarioResponse, Token) 
# y validación estricta para el dominio @unl.edu.ec.

from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import date

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

# Esquema para responderle al frontend (ocultando la clave)
class UsuarioResponse(UsuarioBase):
    id_usuario: int
    id_rol: int

    class Config:
        from_attributes = True # Permite a Pydantic leer los modelos de SQLAlchemy

class Token(BaseModel):
    access_token: str
    token_type: str