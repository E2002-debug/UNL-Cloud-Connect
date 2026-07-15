from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from .database import Base

class DispositivoUsuario(Base):
    __tablename__ = "dispositivo_usuario"

    id_dispositivo = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, nullable=False, index=True)
    expo_push_token = Column(String(255), nullable=False, unique=True)
    fecha_registro = Column(DateTime(timezone=True), server_default=func.now())
