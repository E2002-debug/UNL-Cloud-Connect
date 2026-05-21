from sqlalchemy import Float, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from app.database.session import Base

class Clima(Base):
    __tablename__ = "clima"

    id_clima: Mapped[int] = mapped_column(primary_key=True, index=True)
    temperatura: Mapped[float] = mapped_column(Float, nullable=False)
    humedad: Mapped[float] = mapped_column(Float, nullable=False)
    
    # Delegamos la estampa de tiempo directamente al motor de PostgreSQL
    fecha_captura: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    
    # Según tu diagrama, la fuente (ej. "ESP32" o "Visual Crossing")
    fuente: Mapped[str] = mapped_column(String(50), nullable=False)

    # Relación con la tabla Ubicacion (según el diagrama Clima pertenece a Ubicacion)
    # Nota: Asegúrate de crear el modelo Ubicacion luego para que esta FK no dé error.
    #id_ubicacion: Mapped[int] = mapped_column(ForeignKey("ubicacion.id_ubicacion"), nullable=True)