# Autor: David Guamán
# Fecha: 28/05/2026
# Version: 0.2
# Historial:
# 20/05/2026 v0.1 - David Guamán: Creación de esquemas Pydantic para validar el payload MQTT entrante de la ESP32 y estructurar la respuesta hacia el frontend.
# 28/05/2026 v0.2 - David Guamán: Actualización de los esquemas para incluir los nuevos campos de alerta (alerta, detalles_alerta) y reflejar estos cambios en el payload MQTT.
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional

class ClimaPayload(BaseModel):
    """
    Esquema para validar el JSON que llega por MQTT desde el nodo ESP32.
    """
    # Agregamos rangos lógicos para evitar guardar datos corruptos del sensor
    temperatura: float = Field(..., ge=-50.0, le=100.0, description="Temperatura en grados centígrados")
    humedad: float = Field(..., ge=0.0, le=100.0, description="Humedad relativa en porcentaje")  
    alerta: bool
    detalles_alerta: str
    id_ubicacion: int # Necesario para saber a dónde asignar el dato
    fuente: str = "ESP32" # Valor por defecto importante

class ClimaResponse(BaseModel):
    """
    Esquema para enviar la información climática actual al Frontend.
    """
    id_clima: int
    temperatura: float
    humedad: float
    fecha_captura: datetime
    fuente: str
    alerta: bool
    detalles_alerta: Optional[str] = None
    id_ubicacion: int # Importante para que el front sepa a qué sitio mostrar el clima

    model_config = ConfigDict(from_attributes=True)