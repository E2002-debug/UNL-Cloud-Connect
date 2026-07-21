from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, List

from app.database.session import get_db
from app.schemas.sensor import SensorCreate, SensorResponse, SensorUpdate
from app.schemas.clima import ClimaResponse
from app.crud import crud_sensor, crud_clima
from app.core.security import obtener_usuario_actual, get_admin_user
from app.mqtt.cliente import recargar_registro_sensores

router = APIRouter(
    prefix="/clima",
    tags=["Sensores IoT"]
)

@router.get("/sensores", response_model=List[SensorResponse], status_code=status.HTTP_200_OK)
def listar_sensores(
    db: Session = Depends(get_db),
    usuario: dict = Depends(obtener_usuario_actual)
) -> Any:
    """
    Lista todos los sensores IoT activos registrados en el sistema.
    Requiere autenticación JWT.
    """
    return crud_sensor.listar_sensores(db)

@router.get("/sensores/{id_sensor}", response_model=SensorResponse, status_code=status.HTTP_200_OK)
def obtener_sensor(
    id_sensor: int,
    db: Session = Depends(get_db),
    usuario: dict = Depends(obtener_usuario_actual)
) -> Any:
    """
    Obtiene el detalle de un sensor por su ID.
    """
    sensor = crud_sensor.obtener_sensor_por_id(db, id_sensor)
    if not sensor or not sensor.activo:
        raise HTTPException(status_code=404, detail="Sensor no encontrado")
    return sensor

@router.get("/sensores/{id_sensor}/ultima-lectura", response_model=ClimaResponse, status_code=status.HTTP_200_OK)
def obtener_ultima_lectura_sensor(
    id_sensor: int,
    db: Session = Depends(get_db),
    usuario: dict = Depends(obtener_usuario_actual)
) -> Any:
    """
    Obtiene la última lectura climática registrada por un sensor específico.
    Busca en la tabla clima por el id_ubicacion del sensor.
    """
    sensor = crud_sensor.obtener_sensor_por_id(db, id_sensor)
    if not sensor or not sensor.activo:
        raise HTTPException(status_code=404, detail="Sensor no encontrado")

    ultimo = crud_clima.obtener_ultimo_clima_por_ubicacion(db, sensor.id_ubicacion)
    if not ultimo:
        raise HTTPException(status_code=404, detail="No hay lecturas para este sensor")
    return ultimo

@router.post("/sensores/", response_model=SensorResponse, status_code=status.HTTP_201_CREATED)
def crear_sensor(
    datos: SensorCreate,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_admin_user)
) -> Any:
    """
    Registra un nuevo sensor IoT en el sistema.
    Requiere rol Admin (1) o Superadmin (3).
    """
    existente = crud_sensor.obtener_sensor_por_topico(db, datos.topico_mqtt)
    if existente:
        if not existente.activo:
            existente.activo = True
            existente.nombre = datos.nombre
            existente.tipo = datos.tipo
            if getattr(datos, 'id_ubicacion', None):
                existente.id_ubicacion = datos.id_ubicacion
            db.commit()
            db.refresh(existente)
            recargar_registro_sensores()
            return existente
        else:
            raise HTTPException(status_code=400, detail="Ya existe un sensor activo con ese tópico MQTT")
    nuevo_sensor = crud_sensor.crear_sensor(db, datos)
    recargar_registro_sensores()
    return nuevo_sensor

@router.put("/sensores/{id_sensor}", response_model=SensorResponse, status_code=status.HTTP_200_OK)
def actualizar_sensor(
    id_sensor: int,
    datos: SensorUpdate,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_admin_user)
) -> Any:
    """
    Actualiza los datos de un sensor existente.
    Requiere rol Admin (1) o Superadmin (3).
    """
    sensor = crud_sensor.obtener_sensor_por_id(db, id_sensor)
    if not sensor or not sensor.activo:
        raise HTTPException(status_code=404, detail="Sensor no encontrado")
    actualizado = crud_sensor.actualizar_sensor(db, sensor, datos)
    recargar_registro_sensores()
    return actualizado

@router.delete("/sensores/{id_sensor}", status_code=status.HTTP_200_OK)
def eliminar_sensor(
    id_sensor: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_admin_user)
) -> Any:
    """
    Desactiva (soft delete) un sensor del sistema.
    Requiere rol Admin (1) o Superadmin (3).
    """
    sensor = crud_sensor.obtener_sensor_por_id(db, id_sensor)
    if not sensor or not sensor.activo:
        raise HTTPException(status_code=404, detail="Sensor no encontrado")
    crud_sensor.eliminar_sensor(db, sensor)
    recargar_registro_sensores()
    return {"mensaje": f"Sensor '{sensor.nombre}' desactivado correctamente"}
