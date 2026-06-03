from fastapi import FastAPI
from contextlib import asynccontextmanager
import logging

logger = logging.getLogger(__name__)

from app.database.session import engine, Base, SessionLocal
from app.core.config import settings
from app.core.security import setup_cors
from app.routers import auth, usuarios

# IMPORTACIÓN CRÍTICA: Modelos correspondientes a este microservicio
from app.models.usuario import Usuario

# IMPORTAMOS EL SCRIPT DE SEMBRADO (Roles y administradores)
from app.database.init_db import inicializar_datos_maestros

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Preparar la Base de Datos de Usuarios
    logger.info("Verificando e inicializando tablas de Identidad en PostgreSQL...")
    Base.metadata.create_all(bind=engine)

    # 2. Sembrado de Datos Maestos (Roles)
    logger.info("Verificando datos maestros de usuarios...")
    db = SessionLocal()
    try:
        inicializar_datos_maestros(db)
    finally:
        db.close() 
    
    yield 
    
    logger.info("Deteniendo MS-Usuarios...")

from app.core.middleware import IPRateLimitMiddleware

app = FastAPI(
    title=f"{settings.PROJECT_NAME} - MS Usuarios", 
    version=settings.PROJECT_VERSION,
    lifespan=lifespan,
    root_path="/api",
    docs_url="/auth/docs",
    redoc_url="/auth/redoc",
    openapi_url="/auth/openapi.json"
)

# Inyección modular de CORS desde la configuración centralizada
setup_cors(app)

# Inyección del middleware de protección contra ataques de fuerza bruta (Bloqueo por IP)
# Bloquea una IP por 5 minutos (300s) si hace más de 50 peticiones en 1 minuto (60s)
app.add_middleware(IPRateLimitMiddleware, max_requests=50, window_seconds=60, block_seconds=300)

# Incluimos solo los endpoints de identidad
app.include_router(auth.router)
app.include_router(usuarios.router)