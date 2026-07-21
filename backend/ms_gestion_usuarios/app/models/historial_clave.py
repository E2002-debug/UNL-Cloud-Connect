from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime
from app.database.session import Base

class HistorialClave(Base):
    """
    Almacena el historial de contraseñas hasheadas de cada usuario.
    Se guardan las últimas 5 contraseñas para evitar reutilización.
    """
    __tablename__ = "historial_claves"

    id_historial = Column(Integer, primary_key=True, index=True)
    id_usuario   = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False, index=True)
    clave_hash   = Column(String(255), nullable=False)
    fecha_cambio = Column(DateTime, default=datetime.utcnow)
