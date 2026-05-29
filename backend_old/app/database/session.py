# Autor: David Guamán
# Fecha: 20/05/2026
# Version: 0.1
# Historial:
# 20/05/2026 v0.1 - David Guamán: Configuración de la conexión a PostgreSQL,creación del motor SQLAlchemy y dependencia get_db para inyección en FastAPI.

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
import os

# Obtenemos la URL de la base de datos desde las variables de entorno del contenedor
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres_admin:postgres123456@db:5432/unl_cloud_connect")

# Crear el motor de la base de datos
engine = create_engine(DATABASE_URL, echo=True)

# Crear la fábrica de sesiones locales
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Clase base para que nuestros modelos hereden de ella (Sintaxis SQLAlchemy 2.0)
class Base(DeclarativeBase):
    pass

# Dependencia para obtener la sesión de la DB en los endpoints de FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()