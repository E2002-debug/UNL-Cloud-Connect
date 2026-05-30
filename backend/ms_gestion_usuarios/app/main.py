# Autor: David Guamán
# Fecha: 29/05/2026
# Version: 1.0 (Refactorización a Microservicio de Identidad)
from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.database.session import engine, Base, SessionLocal
from app.core.config import settings
from app.core.security import setup_cors
from app.routers import auth

# IMPORTACIÓN CRÍTICA: Modelos correspondientes a este microservicio
from app.models.usuario import Usuario

# IMPORTAMOS EL SCRIPT DE SEMBRADO (Roles y administradores)
from app.database.init_db import inicializar_datos_maestros

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Preparar la Base de Datos de Usuarios
    print("[STARTUP] Verificando e inicializando tablas de Identidad en PostgreSQL...")
    Base.metadata.create_all(bind=engine)

    # 2. Sembrado de Datos Maestos (Roles)
    print("[STARTUP] Abriendo sesión temporal para verificar datos maestros de usuarios...")
    db = SessionLocal()
    try:
        inicializar_datos_maestros(db)
    finally:
        db.close() 
    
    yield 
    
    print("[SHUTDOWN] Deteniendo MS-Usuarios...")

app = FastAPI(
    title=f"{settings.PROJECT_NAME} - MS Usuarios", 
    version=settings.PROJECT_VERSION,
    lifespan=lifespan,
    root_path="/api/auth"
)

# Inyección de CORS 
setup_cors(app)

# Incluimos solo los endpoints de identidad
app.include_router(auth.router)

