from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.sensor import Sensor
from app.schemas.sensor import SensorCreate, SensorUpdate
from typing import Optional, List

def listar_sensores(db: Session, solo_activos: bool = True) -> List[Sensor]:
    query = db.query(Sensor)
    if solo_activos:
        query = query.filter(Sensor.activo == True)
    return query.order_by(Sensor.fecha_creacion.desc()).all()

def obtener_sensor_por_id(db: Session, id_sensor: int) -> Optional[Sensor]:
    return db.query(Sensor).filter(Sensor.id_sensor == id_sensor).first()

def obtener_sensor_por_topico(db: Session, topico: str) -> Optional[Sensor]:
    return db.query(Sensor).filter(Sensor.topico_mqtt == topico, Sensor.activo == True).first()

def crear_sensor(db: Session, datos: SensorCreate) -> Sensor:
    db_sensor = Sensor(
        nombre=datos.nombre,
        topico_mqtt=datos.topico_mqtt,
        id_ubicacion=datos.id_ubicacion,
        tipo=datos.tipo,
        bateria=datos.bateria,
        firmware_version=datos.firmware_version,
        estado="offline",
        activo=True
    )
    db.add(db_sensor)
    db.commit()
    db.refresh(db_sensor)
    return db_sensor

def actualizar_sensor(db: Session, db_sensor: Sensor, datos: SensorUpdate) -> Sensor:
    actualizados = datos.model_dump(exclude_unset=True)
    for key, value in actualizados.items():
        setattr(db_sensor, key, value)
    db.commit()
    db.refresh(db_sensor)
    return db_sensor

def eliminar_sensor(db: Session, db_sensor: Sensor) -> Sensor:
    db_sensor.activo = False
    db.commit()
    db.refresh(db_sensor)
    return db_sensor

def actualizar_conexion_sensor(db: Session, db_sensor: Sensor, bateria: Optional[float] = None) -> Sensor:
    from datetime import datetime, timezone
    db_sensor.ultima_conexion = datetime.now(timezone.utc)
    db_sensor.estado = "online"
    if bateria is not None:
        db_sensor.bateria = bateria
    db.commit()
    db.refresh(db_sensor)
    return db_sensor

def cargar_registro_sensores(db: Session) -> dict:
    sensores = db.query(Sensor).filter(Sensor.activo == True).all()
    registro = {}
    for s in sensores:
        registro[s.topico_mqtt] = {
            "id_sensor": s.id_sensor,
            "id_ubicacion": s.id_ubicacion
        }
    return registro
