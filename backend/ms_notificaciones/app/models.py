from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.sql import func
from .database import Base

class DispositivoUsuario(Base):
    __tablename__ = "dispositivo_usuario"

    id_dispositivo = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, nullable=False, index=True)
    expo_push_token = Column(String(255), nullable=False, unique=True)
    fecha_registro = Column(DateTime(timezone=True), server_default=func.now())

class NotificacionWeb(Base):
    __tablename__ = "notificacion_web"
    
    id_notificacion = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, nullable=False, index=True) # 0 para broadcast general
    titulo = Column(String(100), nullable=False)
    mensaje = Column(String(500), nullable=False)
    tipo = Column(String(50), default="INFO") # Ej: INFO, ALERTA, CLIMA
    leida = Column(Boolean, default=False)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    
class PreferenciaUsuario(Base):
    __tablename__ = "preferencia_usuario"
    
    id_preferencia = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, nullable=False, unique=True, index=True)
    alertas_clima = Column(Boolean, default=True)
    alertas_eventos = Column(Boolean, default=True)
    alertas_sistema = Column(Boolean, default=True)
