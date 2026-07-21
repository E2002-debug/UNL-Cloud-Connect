# app/database/session.py
# Autor: David Guamán
# Fecha: 29/05/2026
# Version: 0.3
# Historial:
# 20/05/2026 v0.1 - Configuración monolítica.
# 29/05/2026 v0.2 - Refactorización para microservicios.
# 07/06/2026 v0.3 - Adopción de SQLAlchemy 2.0 y control de logs por entorno.

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# Exigimos la lectura estricta desde el entorno inyectado por Docker
DATABASE_URL = os.getenv("DATABASE_URL")

# Leemos si estamos en modo debug (por defecto False si no existe)
# Esto evita que la terminal se inunde de logs en producción
DEBUG_MODE = os.getenv("DEBUG_MODE", "False").lower() == "true"

# Medida de seguridad: Si no hay URL, detenemos el arranque
if not DATABASE_URL:
    raise ValueError("[CRÍTICO] No se encontró la variable DATABASE_URL en el entorno. Verifica tu archivo .env o la configuración de tu orquestador.")

# Crear el motor de la base de datos (echo solo se activa si DEBUG_MODE es True)
engine = create_engine(DATABASE_URL, echo=DEBUG_MODE)

# Crear la fábrica de sesiones locales
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Clase base moderna (SQLAlchemy 2.0)
class Base(DeclarativeBase):
    pass

# Dependencia para inyectar la sesión en los routers
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()