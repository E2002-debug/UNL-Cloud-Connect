# Autor: David Guamán
# Fecha: 22/05/2026
# Version: 0.2
# Historial:
# 20/05/2026 v0.1 - David Guamán: Configuración principal de FastAPI, inicialización de la base de datos, inyección de CORS y registro del enrutador de autenticación.
# 22/05/2026 v0.2 - David Guamán: Implementación del ciclo de vida de la aplicación para iniciar y detener el cliente MQTT automáticamente.
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

# Definir el tópico al que nos vamos a suscribir (Debe coincidir con el código de la ESP32)
TOPICO_CLIMA = "unl/feirnnr/clima/esp32"

def on_connect(client, flags, rc, properties):
    print(f"[MQTT] Conectado exitosamente al broker en {settings.MQTT_BROKER_HOST}")
    # Nos suscribimos al tópico en cuanto se establece la conexión
    client.subscribe(TOPICO_CLIMA, qos=1)

def on_message(client, topic, payload, qos, properties):
    print(f"[MQTT] Mensaje recibido en {topic}")
    try:
        # 1. Decodificar los bytes a string y luego a diccionario JSON
        datos_json = json.loads(payload.decode('utf-8'))
        
        # 2. Validar con el esquema Pydantic que creaste (límites lógicos)
        datos_validados = ClimaPayload(**datos_json)
        
        # 3. Guardar en PostgreSQL abriendo una sesión manual
        db = SessionLocal()
        try:
            crud_clima.crear_registro_clima(
                db=db,
                temperatura=datos_validados.temperatura,
                humedad=datos_validados.humedad,
                fuente="ESP32"
            )
            print(f"[MQTT] Clima guardado OK: T={datos_validados.temperatura}°C, H={datos_validados.humedad}%")
        finally:
            db.close() # Es vital cerrar la sesión para no agotar el pool de conexiones

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