# Autor: David Guamán
# Fecha: 20/05/2026
# Version: 0.1
# Historial:
# 20/05/2026 v0.1 - David Guamán: Creación de los modelos SQLAlchemy para las tablas rol y usuario,preparando el campo clave para soportar el flujo híbrido (Google Sign-In).

from sqlalchemy import String, Date, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from datetime import date
from app.database.session import Base

class Rol(Base):
    __tablename__ = "rol"

    id_rol: Mapped[int] = mapped_column(primary_key=True, index=True)
    nombre_rol: Mapped[str] = mapped_column(String(50), nullable=False)


class Usuario(Base):
    __tablename__ = "usuario"

    id_usuario: Mapped[int] = mapped_column(primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    apellido: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # Puede ser nulo si el usuario se registra puramente con Google (flujo híbrido)
    clave: Mapped[str] = mapped_column(String(255), nullable=True) 
    correo: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    fecha_nacimiento: Mapped[date] = mapped_column(Date, nullable=True)

    # Relación con la tabla Rol
    id_rol: Mapped[int] = mapped_column(ForeignKey("rol.id_rol"), nullable=False)
    
    # Campo de verificación de correo electrónico
    verificado: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false", nullable=False)