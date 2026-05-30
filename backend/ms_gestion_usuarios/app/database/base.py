# Autor: David Guamán
# Fecha: 20/05/2026
# Version: 0.1
# Historial:
# 20/05/2026 v0.1 - David Guamán: Importación centralizada de modelos de base de datos (Usuario, Rol, Clima)}para su registro en SQLAlchemy.

# Importamos la Base y todos los modelos con sus nombres exactos del UML
from app.database.session import Base
from app.models.usuario import Rol, Usuario