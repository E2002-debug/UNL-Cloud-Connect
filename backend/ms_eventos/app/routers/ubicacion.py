"""
Módulo de Enrutamiento: Gestión de Ubicaciones
Este archivo define los endpoints para la administración y consulta de lugares físicos (auditorios, canchas, etc.).
Sigue el mismo estándar de seguridad Zero Trust (vía Kong) que el módulo de eventos.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.models.ubicacion import Ubicacion
from app.schemas.ubicacion import UbicacionCreate, UbicacionResponse

router = APIRouter(
    prefix="/eventos/ubicaciones", 
    tags=["Gestión de Ubicaciones"]
)

# ==============================================================================
# DEPENDENCIAS DE SEGURIDAD (INTEGRACIÓN CON API GATEWAY - KONG)
# ==============================================================================

def verificar_rol_administrador(x_user_role: str = Header(..., alias="x-user-role", description="Rol inyectado por Kong")) -> int:
    """
    Filtro de Control de Acceso Basado en Roles (RBAC).
    Protege la creación de nuevas ubicaciones para evitar que usuarios comunes
    llenen la base de datos con coordenadas falsas o lugares de prueba.
    """
    if x_user_role != "1":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Acceso denegado. Solo los administradores pueden registrar nuevos lugares en el campus."
        )
    return int(x_user_role)


# ==============================================================================
# SECCIÓN PARA EL CLIENTE (APLICACIÓN MÓVIL / FRONTEND WEB)
# Operaciones de solo lectura (GET). Disponibles para cualquier usuario.
# ==============================================================================

@router.get("/", response_model=List[UbicacionResponse], status_code=status.HTTP_200_OK)
def listar_ubicaciones(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Obtiene el catálogo de todas las ubicaciones registradas.
    Esencial para el Frontend: se usa para llenar las listas desplegables (ComboBox) 
    cuando un administrador va a crear un evento, o para renderizar pines en un mapa para los estudiantes.
    """
    ubicaciones = db.query(Ubicacion).offset(skip).limit(limit).all()
    return ubicaciones

@router.get("/{id_ubicacion}", response_model=UbicacionResponse, status_code=status.HTTP_200_OK)
def obtener_detalle_ubicacion(id_ubicacion: int, db: Session = Depends(get_db)):
    """
    Consulta los datos (latitud, longitud, nombre) de una ubicación en específico.
    """
    ubicacion = db.query(Ubicacion).filter(Ubicacion.id_ubicacion == id_ubicacion).first()
    if not ubicacion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La ubicación solicitada no existe.")
    return ubicacion


# ==============================================================================
# SECCIÓN PARA EL ADMINISTRADOR (PANEL DE CONTROL / DASHBOARD)
# Operaciones críticas de escritura (POST). Requieren privilegios elevados.
# ==============================================================================

@router.post("/", response_model=UbicacionResponse, status_code=status.HTTP_201_CREATED)
def crear_ubicacion(
    ubicacion_in: UbicacionCreate, 
    db: Session = Depends(get_db),
    rol_validado: int = Depends(verificar_rol_administrador) # <-- CANDADO ADMINISTRATIVO
):
    """
    Registra un nuevo espacio físico dentro de la universidad.
    Una vez creada, esta ubicación podrá ser asignada a múltiples eventos 
    y podrá recibir telemetría climática a través de su 'id_ubicacion'.
    """
    # Usamos .model_dump() para extraer los datos validados por Pydantic
    nueva_ubicacion = Ubicacion(**ubicacion_in.model_dump())
    
    # Inserción en PostgreSQL
    db.add(nueva_ubicacion)
    db.commit()
    
    # Recargamos el objeto para obtener el 'id_ubicacion' autoincremental generado por la base de datos
    db.refresh(nueva_ubicacion)
    
    return nueva_ubicacion