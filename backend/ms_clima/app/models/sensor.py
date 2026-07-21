from typing import Optional
from sqlalchemy import Float, String, DateTime, Integer, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from app.database.session import Base

class Sensor(Base):
    __tablename__ = "sensores"

    id_sensor: Mapped[int] = mapped_column(primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    topico_mqtt: Mapped[str] = mapped_column(String(200), unique=True, nullable=False, index=True)
    id_ubicacion: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, index=True)
    estado: Mapped[str] = mapped_column(String(20), nullable=False, default="offline")
    bateria: Mapped[float] = mapped_column(Float, nullable=True)
    tipo: Mapped[str] = mapped_column(String(50), nullable=False, default="DHT22")
    ultima_conexion: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    firmware_version: Mapped[str] = mapped_column(String(50), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
