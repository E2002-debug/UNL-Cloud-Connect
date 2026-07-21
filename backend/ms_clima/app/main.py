# Autor: David Guamán
# Fecha: 29/05/2026
# Version: 1.0 (Refactorización a Microservicio de Telemetría)
from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.database.session import engine, Base, SessionLocal
from app.core.config import settings
from app.core.security import setup_cors
from app.database.init_db import inicializar_datos_maestros
from app.routers import clima, sensores

# IMPORTACIÓN CRÍTICA: Modelos correspondientes a este microservicio
from app.models.clima import Clima
from app.models.sensor import Sensor

from app.mqtt.cliente import iniciar_mqtt, detener_mqtt

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Preparar la Base de Datos de Telemetría
    print("[STARTUP] Verificando e inicializando tabla de Clima en PostgreSQL...")
    Base.metadata.create_all(bind=engine)

    # 2. Migraciones y datos maestros
    print("[STARTUP] Ejecutando migraciones de esquema...")
    db = SessionLocal()
    try:
        inicializar_datos_maestros(db)
    finally:
        db.close()

    # 3. Lógica de inicio MQTT
    print("[STARTUP] Iniciando servicios en segundo plano (Broker MQTT)...")
    await iniciar_mqtt()
    
    yield 
    
    # 3. Lógica de apagado
    print("[SHUTDOWN] Deteniendo conexión MQTT y MS-Clima...")
    await detener_mqtt()

app = FastAPI(
    title=f"{settings.PROJECT_NAME} - MS Clima", 
    version=settings.PROJECT_VERSION,
    lifespan=lifespan,
    root_path="/api",
    docs_url="/clima/docs",
    redoc_url="/clima/redoc",
    openapi_url="/clima/openapi.json"
)

# Inyección de CORS 
setup_cors(app)

# Incluimos solo los endpoints de telemetría
app.include_router(clima.router)
app.include_router(sensores.router)
