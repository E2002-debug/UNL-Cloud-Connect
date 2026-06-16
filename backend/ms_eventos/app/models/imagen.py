import enum
from sqlalchemy import String, Integer, ForeignKey, DateTime, Enum as SQLEnum, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime
from app.database.session import Base

# Definimos el Enum de Python exacto a tu diagrama UML
class TipoReaccion(str, enum.Enum):
    ME_GUSTA = "ME_GUSTA"
    NO_ME_GUSTA = "NO_ME_GUSTA"

class ImagenEvento(Base):
    __tablename__ = "imagen_evento"

    id_imagen: Mapped[int] = mapped_column(primary_key=True, index=True)
    # URL pública que MinIO nos devolverá tras subir el archivo
    url_minio: Mapped[str] = mapped_column(String(500), nullable=False) 
    fecha_subida: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    
    # Llave foránea estricta: La imagen le pertenece físicamente a un evento en esta misma BD
    id_evento: Mapped[int] = mapped_column(ForeignKey("evento.id_evento", ondelete="CASCADE"), nullable=False)

    # Relación inversa hacia el evento
    evento: Mapped["Evento"] = relationship(back_populates="imagenes")

    # Referencia lógica al usuario que subió la imagen
    id_usuario: Mapped[int] = mapped_column(Integer, nullable=False, index=True)

    # Relaciones para que SQLAlchemy pueda navegar entre objetos
    reacciones: Mapped[list["Reaccion"]] = relationship("Reaccion", back_populates="imagen", cascade="all, delete-orphan")

class Reaccion(Base):
    __tablename__ = "reaccion"

    id_reaccion: Mapped[int] = mapped_column(primary_key=True, index=True)
    tipo: Mapped[TipoReaccion] = mapped_column(SQLEnum(TipoReaccion), nullable=False)
    fecha_reaccion: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    
    # Referencia Lógica: ID del microservicio ms-usuarios (Sin ForeignKey)
    id_usuario: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    
    # Llave foránea a la imagen dentro de esta misma BD
    id_imagen: Mapped[int] = mapped_column(ForeignKey("imagen_evento.id_imagen", ondelete="CASCADE"), nullable=False)
    
    imagen: Mapped["ImagenEvento"] = relationship("ImagenEvento", back_populates="reacciones")

    # <-- CANDADO DE SEGURIDAD AÑADIDO -->
    __table_args__ = (
        UniqueConstraint('id_imagen', 'id_usuario', name='uq_imagen_usuario_reaccion'),
    )