import json
import asyncio
from gmqtt import Client as MQTTClient
from pydantic import ValidationError

from app.core.config import settings
from app.database.session import SessionLocal
from app.crud import crud_sensor, crud_clima
from app.schemas.clima import ClimaPayload

cliente_mqtt = MQTTClient("unl-backend-fastapi")

REGISTRO_SENSORES = {}

def recargar_registro_sensores():
    """
    Carga los sensores activos desde la base de datos y construye el
    mapa topico_mqtt -> { id_sensor, id_ubicacion }.
    """
    global REGISTRO_SENSORES
    db = SessionLocal()
    try:
        REGISTRO_SENSORES = crud_sensor.cargar_registro_sensores(db)
        print(f"[MQTT] Registro de sensores cargado: {len(REGISTRO_SENSORES)} sensores activos")
    except Exception as e:
        print(f"[MQTT-ERROR] No se pudo cargar el registro de sensores: {e}")
        REGISTRO_SENSORES = {}
    finally:
        db.close()

def on_connect(client, flags, rc, properties):
    print(f"[MQTT] Conectado exitosamente al broker en {settings.MQTT_BROKER_HOST}")
    recargar_registro_sensores()
    client.subscribe("unl/clima/#", qos=1)

def on_message(client, topic, payload, qos, properties):
    global REGISTRO_SENSORES
    print(f"[MQTT] Mensaje recibido en {topic}")

    info_sensor = REGISTRO_SENSORES.get(topic)

    if not info_sensor:
        print(f"[MQTT-WARNING] Sensor no registrado en tópico: {topic} (Payload ignorado: {payload.decode('utf-8', 'ignore')})")
        return

    try:
        raw_payload = payload.decode('utf-8')
        print(f"[MQTT-DEBUG] Payload crudo recibido: {raw_payload}")
        datos_json = json.loads(raw_payload)
        datos_validados = ClimaPayload(**datos_json)

        db = SessionLocal()
        try:
            sensor_db = crud_sensor.obtener_sensor_por_id(db, info_sensor["id_sensor"])
            if sensor_db and sensor_db.activo:
                crud_sensor.actualizar_conexion_sensor(db, sensor_db, datos_validados.temperatura if 'bateria' not in datos_json else None)

            crud_clima.crear_registro_clima(
                db=db,
                temperatura=datos_validados.temperatura,
                humedad=datos_validados.humedad,
                fuente=datos_validados.fuente,
                alerta=datos_validados.alerta,
                detalles_alerta=datos_validados.detalles_alerta,
                id_ubicacion=info_sensor["id_ubicacion"]
            )
            print(f"[MQTT] Clima guardado OK: T={datos_validados.temperatura}°C, "
                  f"H={datos_validados.humedad}%, Sensor={info_sensor['id_sensor']}, "
                  f"Ubicacion={info_sensor['id_ubicacion']}")

            if topic in REGISTRO_SENSORES:
                REGISTRO_SENSORES[topic] = info_sensor
        finally:
            db.close()

    except json.JSONDecodeError:
        print("[MQTT-ERROR] El payload recibido no es un JSON válido.")
    except ValidationError as e:
        print(f"[MQTT-ERROR] Datos descartados por validación Pydantic: {e}")
    except Exception as e:
        print(f"[MQTT-ERROR] Falla interna al procesar el mensaje: {e}")

def on_disconnect(client, packet, exc=None):
    print("[MQTT] Desconectado del broker.")

cliente_mqtt.on_connect = on_connect
cliente_mqtt.on_message = on_message
cliente_mqtt.on_disconnect = on_disconnect

async def iniciar_mqtt():
    try:
        await cliente_mqtt.connect(settings.MQTT_BROKER_HOST, 1883, keepalive=60)
    except Exception as e:
        print(f"[MQTT-CRÍTICO] No se pudo conectar al broker Mosquitto: {e}")

async def detener_mqtt():
    await cliente_mqtt.disconnect()
