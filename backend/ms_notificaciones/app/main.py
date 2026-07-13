# Autor: Miguel Luna
# Fecha: 07/07/2026
# Version: 1.0
# Historial:
# 07/07/2026 v1.0 - Miguel Luna: Inicialización del microservicio. Implementación de endpoints de Push Notifications (Expo) e integración base MQTT para alertas IoT.

from fastapi import FastAPI, HTTPException
import logging
from .schemas import PushRequest, EventoNotificacionRequest
from .services import enviar_push_expo, procesar_notificacion_evento
from .config import settings
from gmqtt import Client as MQTTClient
from gmqtt.mqtt.constants import MQTTv311
from fastapi import Depends
from sqlalchemy.orm import Session
from .database import engine, Base, get_db
from .models import DispositivoUsuario
from .schemas import GuardarTokenRequest

# Crear tablas en la BD
Base.metadata.create_all(bind=engine)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="UNL-Cloud-Connect - MS Notificaciones (Push & IoT)",
    version="1.0.0",
    root_path="/api/notificaciones"
)

# Configuración MQTT
mqtt_client = MQTTClient("ms_notificaciones_client")

def on_message(client, topic, payload, qos, properties):
    import json
    logger.info(f"Mensaje MQTT recibido en {topic}: {payload.decode()}")
    if topic == "clima/alerta":
        try:
            data = json.loads(payload.decode())
            # Aquí podrías consultar a la base de datos por los tokens, por ahora solo mostramos el log
            logger.info(f"Alerta IoT detectada: {data}. (Listo para hacer Push a usuarios)")
        except Exception as e:
            logger.error(f"Error procesando alerta MQTT: {e}")

mqtt_client.on_message = on_message

import os
_MQTT_USER = os.getenv("MQTT_USERNAME", "ms-clima")
_MQTT_PASS = os.getenv("MQTT_PASSWORD", "")
if _MQTT_PASS:
    mqtt_client.set_auth_credentials(_MQTT_USER, _MQTT_PASS)

@app.on_event("startup")
async def startup_event():
    logger.info(f"Conectando al Broker MQTT en {settings.MQTT_BROKER_HOST}:{settings.MQTT_BROKER_PORT}")
    try:
        await mqtt_client.connect(settings.MQTT_BROKER_HOST, settings.MQTT_BROKER_PORT, version=MQTTv311)
        mqtt_client.subscribe("clima/alerta")
        logger.info("Suscripción a 'clima/alerta' exitosa")
    except Exception as e:
        logger.warning(f"No se pudo conectar a MQTT (Broker apagado o inaccesible): {e}")

@app.on_event("shutdown")
async def shutdown_event():
    await mqtt_client.disconnect()

@app.get("/")
async def root():
    return {"message": "Microservicio de Notificaciones (Push & IoT) en linea"}

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ms_notificaciones"}

@app.post("/push", summary="Enviar Push Notification básica")
async def send_push_endpoint(req: PushRequest):
    res = await enviar_push_expo(req)
    if not res:
        raise HTTPException(status_code=500, detail="Error al enviar la notificacion Push")
    return {"status": "success", "expo_response": res}

@app.post("/guardar-token", summary="Guardar el Push Token de un usuario")
async def guardar_token_endpoint(req: GuardarTokenRequest, db: Session = Depends(get_db)):
    # Upsert logic: Si existe para ese usuario y token, ignorar; o actualizar si es nuevo.
    existente = db.query(DispositivoUsuario).filter(
        DispositivoUsuario.id_usuario == req.id_usuario,
        DispositivoUsuario.expo_push_token == req.expo_push_token
    ).first()
    
    if not existente:
        nuevo_disp = DispositivoUsuario(
            id_usuario=req.id_usuario,
            expo_push_token=req.expo_push_token
        )
        db.add(nuevo_disp)
        db.commit()
        return {"status": "success", "message": "Token guardado"}
    return {"status": "success", "message": "El token ya existía"}

@app.post("/eventos/alerta", summary="Notificar creación o cancelación de eventos (Admin y Usuarios)")
async def alerta_evento_endpoint(req: EventoNotificacionRequest):
    """
    Endpoint transversal para ser llamado desde ms_eventos. 
    Distribuye los mensajes correctos tanto al administrador como a los participantes.
    """
    resultados = await procesar_notificacion_evento(req)
    return {
        "status": "success", 
        "message": "Notificaciones distribuidas correctamente",
        "detalles": resultados
    }
