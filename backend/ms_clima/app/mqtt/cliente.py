# Autor: David Guamán
# Fecha: 28/05/2026
# Version: 0.3
# Historial:
# 20/05/2026 v0.1 - David Guamán: Configuración principal de FastAPI, inicialización de la base de datos, inyección de CORS y registro del enrutador de autenticación.
# 22/05/2026 v0.2 - David Guamán: Implementación del ciclo de vida de la aplicación para iniciar y detener el cliente MQTT automáticamente.
# 28/05/2026 v0.3 - David Guamán: Actualización de la función de creación de registros climáticos para incluir los nuevos campos de alerta.
import json
import asyncio
from gmqtt import Client as MQTTClient
from pydantic import ValidationError

from app.core.config import settings
from app.database.session import SessionLocal
from app.crud import crud_clima
from app.schemas.clima import ClimaPayload

# Instancia del cliente MQTT
cliente_mqtt = MQTTClient("unl-backend-fastapi")

# =================================================================
# REGISTRO DE GEMELOS DIGITALES (Device Registry)
# Mapea el tópico MQTT del sensor con el id_ubicacion de la Base de Datos
# =================================================================
REGISTRO_SENSORES = {
    "unl/clima/esp32": 1
}

def on_connect(client, flags, rc, properties):
    print(f"[MQTT] Conectado exitosamente al broker en {settings.MQTT_BROKER_HOST}")
    # Usamos el comodín '#' para suscribirnos a TODOS los sensores de la universidad a la vez
    client.subscribe("unl/clima/#", qos=1)

def on_message(client, topic, payload, qos, properties):
    print(f"[MQTT] Mensaje recibido en {topic}")
    
    # 1. RESOLUCIÓN DE IDENTIDAD: El backend deduce la ubicación leyendo el tópico
    id_ubicacion_real = REGISTRO_SENSORES.get(topic)
    
    if not id_ubicacion_real:
        print(f"[MQTT-WARNING] Mensaje ignorado. Sensor no registrado en tópico: {topic}")
        return # Detenemos el flujo si el sensor no es de confianza

    try:
        datos_json = json.loads(payload.decode('utf-8'))
        
        # 2. VALIDACIÓN: Pydantic ya no exige id_ubicacion en el JSON
        datos_validados = ClimaPayload(**datos_json)
        
        db = SessionLocal()
        try:
            # 3. PERSISTENCIA: Pasamos el ID inyectado por nuestro diccionario
            crud_clima.crear_registro_clima(
                db=db,
                temperatura=datos_validados.temperatura,
                humedad=datos_validados.humedad,
                fuente="ESP32",
                alerta=datos_validados.alerta,
                detalles_alerta=datos_validados.detalles_alerta,
                id_ubicacion=id_ubicacion_real # <-- ¡Inyección desde el diccionario!
            )
            print(f"[MQTT] Clima guardado OK: T={datos_validados.temperatura}°C, H={datos_validados.humedad}%, Ubicacion={id_ubicacion_real}")
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

# Asignar los callbacks al cliente
cliente_mqtt.on_connect = on_connect
cliente_mqtt.on_message = on_message
cliente_mqtt.on_disconnect = on_disconnect

async def iniciar_mqtt():
    """Conecta el cliente al broker Mosquitto definido en Docker."""
    try:
        await cliente_mqtt.connect(settings.MQTT_BROKER_HOST, 1883, keepalive=60)
    except Exception as e:
        print(f"[MQTT-CRÍTICO] No se pudo conectar al broker Mosquitto: {e}")

async def detener_mqtt():
    """Desconecta el cliente de forma limpia."""
    await cliente_mqtt.disconnect()