# Autor: David Guamán
# Fecha: 20/05/2026
# Version: 0.1
# Historial:
# David Guamán: Configuración principal de FastAPI, inicialización de la base de datos, 
# inyección de CORS y registro del enrutador de autenticación.

from fastapi import FastAPI

from app.database.session import engine, Base
from app.core.config import settings
from app.core.security import setup_cors
from app.routers import auth
# IMPORTACIÓN CRÍTICA: Debes importar los modelos explícitamente.
# Si borras estas dos líneas, SQLAlchemy NO creará las tablas en Postgres.
from app.models.usuario import Usuario
from app.models.clima import Clima

# Creación de tablas
Base.metadata.create_all(bind=engine)

# Instancia limpia usando config.py
app = FastAPI(title=settings.PROJECT_NAME, version=settings.PROJECT_VERSION)

# Inyección de CORS para permitir que React y la App móvil se conecten
setup_cors(app)

# Incluimos los endpoints de autenticación en la aplicación
app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"mensaje": f"{settings.PROJECT_NAME} operativa y base de datos conectada"}