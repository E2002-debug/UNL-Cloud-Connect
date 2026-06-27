from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from datetime import datetime
from app.database.session import Base

class AuditoriaUsuario(Base):
    __tablename__ = "auditoria_usuarios"

    id_log = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=True)
    correo = Column(String(255), nullable=True)
    accion = Column(String(100), nullable=False)
    fecha_hora = Column(DateTime, default=datetime.utcnow)
    ip_origen = Column(String(50), nullable=True)
    detalles = Column(Text, nullable=True)
