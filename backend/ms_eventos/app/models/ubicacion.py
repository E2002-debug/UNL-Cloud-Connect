from sqlalchemy import String, Numeric
from sqlalchemy.orm import Mapped, mapped_column ,relationship
from app.database.session import Base

class Ubicacion(Base):
    __tablename__ = "ubicacion"

    id_ubicacion: Mapped[int] = mapped_column(primary_key=True, index=True)
    latitud: Mapped[float] = mapped_column(Numeric(9, 6), nullable=False)
    longitud: Mapped[float] = mapped_column(Numeric(9, 6), nullable=False)
    nombre_lugar: Mapped[str] = mapped_column(String(150), nullable=False)
    direccion_alfa_numerica: Mapped[str|None] = mapped_column(String(255), nullable=True)