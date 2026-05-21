# Autor: David Guamán
# Fecha: 20/05/2026
# Version: 0.1
# Historial:
# David Guamán: Creación de funciones CRUD para insertar y obtener datos de temperatura y humedad enviados por la ESP32.
###########################################################################
from sqlalchemy.orm import Session
from app.models.clima import Clima

def crear_registro_clima(db: Session, temperatura: float, humedad: float, fuente: str = "ESP32"):
    """
    Inserta un nuevo registro climático en la base de datos.
    La fecha_captura se genera automáticamente en PostgreSQL gracias al server_default.
    """
    db_clima = Clima(
        temperatura=temperatura,
        humedad=humedad,
        fuente=fuente
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