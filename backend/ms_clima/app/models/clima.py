# Autor: David Guamán
# Fecha: 28/05/2026
# Version: 0.1
# Historial:
# 20/05/2026 v0.1 - David Guamán: Creación del modelo SQLAlchemy para la tabla clima, preparando la estructura para los datos de la ESP32.
# 28/05/2026 v0.2 - David Guamán: Adición de campos de alerta (alerta, detalle_alerta) para futuras funcionalidades de notificaciones basadas en condiciones climáticas.
from sqlalchemy import Float, String, DateTime, Integer
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

    alerta: Mapped[bool] = mapped_column(default=False)

    detalles_alerta: Mapped[str] = mapped_column(String(100), nullable=True)

    # Relación con la tabla Ubicacion (según el diagrama Clima pertenece a Ubicacion)
    # Referencia desacoplada (Arquitectura de Microservicios)
    id_ubicacion: Mapped[int] = mapped_column(Integer, nullable=True, index=True)