import enum
from sqlalchemy import String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.database.session import Base

# Paso 1.3: Definición del Enumerador según el UML
class ProgresoEvento(str, enum.Enum):
    PROGRAMADO = "PROGRAMADO"
    EN_PROGRESO = "EN_PROGRESO"
    FINALIZADO = "FINALIZADO"
    CANCELADO = "CANCELADO"

# Paso 1.2: Modelo principal del Evento
class Evento(Base):
    __tablename__ = "evento"

    id_evento: Mapped[int] = mapped_column(primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    descripcion: Mapped[str] = mapped_column(String(500), nullable=False)
    fecha_hora_inicio: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    fecha_hora_final: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Implementación estricta de la columna estado
    estado: Mapped[ProgresoEvento] = mapped_column(
        SQLEnum(ProgresoEvento), 
        default=ProgresoEvento.PROGRAMADO, 
        nullable=False
    )

    # ---------------------------------------------------------
    # RELACIONES Y ARQUITECTURA DE MICROSERVICIOS
    # ---------------------------------------------------------
    ubicacion: Mapped["Ubicacion"] = relationship(lazy="joined")
    # Llave foránea INTERNA: Estricta, porque Ubicacion pertenece a ms_eventos
    id_ubicacion: Mapped[int] = mapped_column(ForeignKey("ubicacion.id_ubicacion"), nullable=False)
    
    # Relación con imágenes del evento
    imagenes: Mapped[list["ImagenEvento"]] = relationship(back_populates="evento", cascade="all, delete-orphan")

    # Llave de referencia EXTERNA: No es ForeignKey porque el Usuario vive en otra DB
    id_usuario: Mapped[int] = mapped_column(nullable=False, index=True)