# Autor: David Guamán
# Fecha: 29/05/2026
# Version: 0.2
# Historial:
# 20/05/2026 v0.1 - David Guamán: Configuración monolítica.
# 29/05/2026 v0.2 - David Guamán: Refactorización estricta de variables de entorno para arquitectura de microservicios y despliegue en la nube.

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
import os

# Exigimos la lectura estricta desde el entorno inyectado por Docker
DATABASE_URL = os.getenv("DATABASE_URL")

# Medida de seguridad: Si no hay URL, detenemos el arranque
if not DATABASE_URL:
    raise ValueError("[CRÍTICO] No se encontró la variable DATABASE_URL en el entorno. Verifica tu archivo .env o la configuración de tu orquestador.")

# Crear el motor de la base de datos
engine = create_engine(DATABASE_URL, echo=True)

# Crear la fábrica de sesiones locales
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Clase base 
class Base(DeclarativeBase):
    pass

# Dependencia para los endpoints
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()