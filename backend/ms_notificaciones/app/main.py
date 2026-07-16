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
from .models import DispositivoUsuario, NotificacionWeb, PreferenciaUsuario
from .schemas import GuardarTokenRequest
from .ws_manager import manager
from fastapi import WebSocket, WebSocketDisconnect
from .security import validar_token, get_current_admin

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
async def send_push_endpoint(req: PushRequest, admin_payload: dict = Depends(get_current_admin)):
    res = await enviar_push_expo(req)
    if not res:
        raise HTTPException(status_code=500, detail="Error al enviar la notificacion Push")
    return {"status": "success", "expo_response": res}

@app.post("/guardar-token", summary="Guardar el Push Token de un usuario")
async def guardar_token_endpoint(req: GuardarTokenRequest, db: Session = Depends(get_db), usuario_payload: dict = Depends(validar_token)):
    # Upsert logic: Si existe para ese usuario y token, ignorar; o actualizar si es nuevo.
    # V-N9 Fix: Forzar que el id_usuario corresponda al token para evitar suplantación
    id_usuario_real = int(usuario_payload.get("id_usuario", req.id_usuario))
    
    existente = db.query(DispositivoUsuario).filter(
        DispositivoUsuario.id_usuario == id_usuario_real,
        DispositivoUsuario.expo_push_token == req.expo_push_token
    ).first()
    
    if not existente:
        nuevo_disp = DispositivoUsuario(
            id_usuario=id_usuario_real,
            expo_push_token=req.expo_push_token
        )
        db.add(nuevo_disp)
        db.commit()
        return {"status": "success", "message": "Token guardado"}
    return {"status": "success", "message": "El token ya existía"}

@app.post("/eventos/alerta", summary="Notificar creación o cancelación de eventos (Admin y Usuarios)")
async def alerta_evento_endpoint(req: EventoNotificacionRequest, admin_payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    """
    Endpoint transversal para ser llamado desde ms_eventos. 
    Distribuye los mensajes correctos tanto al administrador como a los participantes.
    Solo puede ser ejecutado por un administrador.
    """
    resultados = await procesar_notificacion_evento(req, db)
    return {
        "status": "success", 
        "message": "Notificaciones distribuidas correctamente",
        "detalles": resultados
    }

# ==========================================
# ENDPOINTS WEB (WebSockets & Historial)
# ==========================================

@app.websocket("/ws/{id_usuario}")
async def websocket_endpoint(websocket: WebSocket, id_usuario: int):
    await manager.connect(websocket, id_usuario)
    try:
        while True:
            # Mantener conexión viva
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, id_usuario)

@app.get("/historial")
async def obtener_historial_notificaciones(db: Session = Depends(get_db)):
    # Retorna las últimas 50 notificaciones (id_usuario = 0 son globales)
    notificaciones = db.query(NotificacionWeb).order_by(NotificacionWeb.fecha_creacion.desc()).limit(50).all()
    return notificaciones

@app.put("/historial/{id_notificacion}/leer")
async def marcar_notificacion_leida(id_notificacion: int, db: Session = Depends(get_db)):
    notif = db.query(NotificacionWeb).filter(NotificacionWeb.id_notificacion == id_notificacion).first()
    if notif:
        notif.leida = True
        db.commit()
        return {"status": "success"}
    raise HTTPException(status_code=404, detail="Notificación no encontrada")

@app.get("/preferencias/{id_usuario}")
async def obtener_preferencias(id_usuario: int, db: Session = Depends(get_db)):
    prefs = db.query(PreferenciaUsuario).filter(PreferenciaUsuario.id_usuario == id_usuario).first()
    if not prefs:
        prefs = PreferenciaUsuario(id_usuario=id_usuario)
        db.add(prefs)
        db.commit()
        db.refresh(prefs)
    return prefs

@app.put("/preferencias/{id_usuario}")
async def actualizar_preferencias(id_usuario: int, payload: dict, db: Session = Depends(get_db)):
    prefs = db.query(PreferenciaUsuario).filter(PreferenciaUsuario.id_usuario == id_usuario).first()
    if not prefs:
        prefs = PreferenciaUsuario(id_usuario=id_usuario)
        db.add(prefs)
    
    if "alertas_clima" in payload: prefs.alertas_clima = payload["alertas_clima"]
    if "alertas_eventos" in payload: prefs.alertas_eventos = payload["alertas_eventos"]
    if "alertas_sistema" in payload: prefs.alertas_sistema = payload["alertas_sistema"]
    
    db.commit()
    return {"status": "success"}
