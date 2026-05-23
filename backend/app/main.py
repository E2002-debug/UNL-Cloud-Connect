# Autor: David Guamán
# Fecha: 22/05/2026
# Version: 0.2
# Historial:
# 20/05/2026 v0.1 - David Guamán: Configuración principal de FastAPI, inicialización de la base de datos, inyección de CORS y registro del enrutador de autenticación.
# 22/05/2026 v0.2 - David Guamán: Implementación del ciclo de vida de la aplicación para iniciar y detener el cliente MQTT en segundo plano, además de registrar el router de clima para manejar la telemetría enviada por la ESP32.

from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.database.session import engine, Base
from app.core.config import settings
from app.core.security import setup_cors
from app.routers import auth, clima
# IMPORTACIÓN CRÍTICA: Debes importar los modelos explícitamente.
# Si borras estas dos líneas, SQLAlchemy NO creará las tablas en Postgres.
from app.models.usuario import Usuario
from app.models.clima import Clima
from app.mqtt.client import iniciar_mqtt, detener_mqtt
# Creación de tablas
Base.metadata.create_all(bind=engine)


# Definimos el ciclo de vida de la aplicación para servicios en segundo plano
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Lógica de inicio (Startup)
    print("Iniciando servicios en segundo plano...")
    await iniciar_mqtt()
    
    yield # Aquí la aplicación de FastAPI se queda corriendo y recibiendo peticiones HTTP
    
    # Lógica de apagado (Shutdown)
    print("Deteniendo servicios...")
    await detener_mqtt()

# Instancia limpia usando config.py
app = FastAPI(
    title=settings.PROJECT_NAME, 
    version=settings.PROJECT_VERSION,
    lifespan=lifespan
)

# Inyección de CORS para permitir que React y la App móvil se conecten
setup_cors(app)

# Incluimos los endpoints 
app.include_router(auth.router)
app.include_router(clima.router)

@app.get("/")
def read_root():
    return {"mensaje": f"{settings.PROJECT_NAME} operativa, MQTT escuchando y base de datos conectada"}