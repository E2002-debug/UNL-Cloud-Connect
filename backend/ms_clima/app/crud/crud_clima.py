# Autor: David Guamán
# Fecha: 28/05/2026
# Version: 0.2
# Historial:
# 20/05/2026 v0.1 - David Guamán: Creación de funciones CRUD para insertar y obtener datos de temperatura y humedad enviados por la ESP32.
# 28/05/2026 v0.2 - David Guamán: Actualización de la función de creación de registros climáticos para incluir los nuevos campos de alerta (alerta, detalles_alerta) y reflejar estos cambios en el payload MQTT.
from sqlalchemy.orm import Session
from app.models.clima import Clima
from typing import Optional

def crear_registro_clima(db: Session, 
                         temperatura: float, 
                         humedad: float, 
                         id_ubicacion: int, 
                         fuente: str = "ESP32", 
                         alerta: bool = False, 
                         detalles_alerta: Optional[str] = None):
    """
    Inserta un nuevo registro climático en la base de datos.
    La fecha_captura se genera automáticamente en PostgreSQL gracias al server_default.
    """
    db_clima = Clima(
        temperatura=temperatura,
        humedad=humedad,
        fuente=fuente,
        alerta=alerta,
        detalles_alerta=detalles_alerta,
        id_ubicacion=id_ubicacion
    )
    
    db.add(db_clima)
    db.commit()
    db.refresh(db_clima)
    
    return db_clima

def obtener_ultimo_clima(db: Session):
    """
    Obtiene el registro climático más reciente para mostrarlo en el Frontend.
    """
    return db.query(Clima).order_by(Clima.fecha_captura.desc()).first()

def obtener_ultimo_clima_por_ubicacion(db: Session, id_ubicacion: int):
    """
    Obtiene el último registro climático para una ubicación específica.
    """
    return db.query(Clima).filter(
        Clima.id_ubicacion == id_ubicacion
    ).order_by(Clima.fecha_captura.desc()).first()