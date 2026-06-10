# main.py
from fastapi import FastAPI

from app.database.session import engine, Base
import app.database.base  # Importación crítica para que SQLAlchemy reconozca las tablas
from app.routers import eventos, ubicacion

# Importaciones desde tu carpeta CORE
from app.core.security import configurar_seguridad_app
from app.core.config import settings

# Creación física de las tablas en PostgreSQL (db_eventos)
Base.metadata.create_all(bind=engine)

# Inyectamos la configuración modularizada
app = FastAPI(
    title=f"{settings.PROJECT_NAME} - MS Eventos",
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    root_path="/api",
    docs_url="/eventos/docs",
    redoc_url="/eventos/redoc",
    openapi_url="/eventos/openapi.json",

)

# 1. Aplicar configuraciones de seguridad (CORS)
configurar_seguridad_app(app)

# 2. Integración de los routers
app.include_router(eventos.router)
app.include_router(ubicacion.router)

