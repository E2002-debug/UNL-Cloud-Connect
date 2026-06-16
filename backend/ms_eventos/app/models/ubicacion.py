from sqlalchemy import String, Numeric, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.database.session import Base

class Ubicacion(Base):
    __tablename__ = "ubicacion"

    id_ubicacion: Mapped[int] = mapped_column(primary_key=True, index=True)
    latitud: Mapped[float] = mapped_column(Numeric(9, 6), nullable=False)
    longitud: Mapped[float] = mapped_column(Numeric(9, 6), nullable=False)
    nombre_lugar: Mapped[str] = mapped_column(String(150), nullable=False)
    direccion_alfa_numerica: Mapped[str | None] = mapped_column(String(255), nullable=True)
    id_usuario_creador: Mapped[int] = mapped_column(Integer, nullable=False)
    id_rol_creador: Mapped[int] = mapped_column(Integer, nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)