import pytest
import paho.mqtt.client as mqtt
import json
import time

MQTT_BROKER = "localhost"
MQTT_PORT = 1884 # Como se indica en AGENTS.md

def test_mqtt_broker_connection():
    """
    Prueba de conexión básica al broker Mosquitto en el puerto 1884.
    """
    client = mqtt.Client()
    
    connected = False
    
    def on_connect(client, userdata, flags, rc):
        nonlocal connected
        if rc == 0:
            connected = True
            
    client.on_connect = on_connect
    
    try:
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_start()
        time.sleep(1) # Esperar a la conexión
        client.loop_stop()
        
        assert connected, "No se pudo conectar al broker MQTT"
    except Exception as e:
        pytest.fail(f"Fallo en la conexión MQTT: {str(e)}")

def test_publicar_clima_falso():
    """
    Simula publicar un mensaje de clima falso (ej. sensor IoT)
    para ver si el ms_clima lo puede interceptar.
    """
    client = mqtt.Client()
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    
    fake_payload = {
        "temperatura": 25.5,
        "humedad": 60.0,
        "timestamp": "2026-07-15T12:00:00Z"
    }
    
    result = client.publish("unl/clima/sensores", json.dumps(fake_payload))
    assert result.rc == mqtt.MQTT_ERR_SUCCESS, "Error publicando mensaje de prueba"
    client.disconnect()
