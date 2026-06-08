"""
Módulo de Enrutamiento: Gestión de Eventos
Este archivo define los endpoints del microservicio de eventos. 
Implementa arquitectura Zero Trust confiando en los headers inyectados por el API Gateway (Kong)
y separa claramente las operaciones de lectura (públicas/clientes) de las de escritura (administradores).
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from app.services.notificaciones import enviar_alerta_nuevo_evento 
from app.database.session import get_db
from app.schemas.evento import EventoCreate, EventoUpdate, EventoResponse
from app.models.evento import ProgresoEvento  
from app.crud import crud_evento

router = APIRouter(
    prefix="/eventos",
    tags=["Gestión de Eventos"]
)

# ==============================================================================
# DEPENDENCIAS DE SEGURIDAD (INTEGRACIÓN CON API GATEWAY - KONG)
# ==============================================================================

def obtener_id_usuario_gateway(x_user_id: str = Header(..., alias="x-user-id", description="ID inyectado por Kong")) -> int:
    """
    Extrae el ID del usuario autenticado desde los encabezados de la petición.
    En una arquitectura de microservicios, el Gateway (Kong) ya validó el JWT, 
    por lo que aquí solo interceptamos el ID resultante.
    """
    if not x_user_id.isdigit():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no autenticado correctamente por el Gateway.")
    return int(x_user_id)

def verificar_rol_administrador(x_user_role: str = Header(..., alias="x-user-role", description="Rol inyectado por Kong")) -> int:
    """
    Filtro de Control de Acceso Basado en Roles (RBAC).
    Bloquea la petición inmediatamente si el rol inyectado no corresponde al ID 1 (Administrador).
    """
    if x_user_role != "1":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Acceso denegado. Se requieren privilegios de Administrador para realizar modificaciones."
        )
    return int(x_user_role)


# ==============================================================================
# SECCIÓN PARA EL CLIENTE (APLICACIÓN MÓVIL / ESTUDIANTES / DOCENTES)
# Operaciones de solo lectura (GET). No requieren validación estricta de roles.
# ==============================================================================

@router.get("/activos", response_model=List[EventoResponse], status_code=status.HTTP_200_OK)
def listar_eventos_activos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Endpoint de consumo masivo para el feed principal de la aplicación.
    Retorna la lista de eventos que están actualmente en curso o programados.
    Cualquier usuario autenticado en la red puede consultar esta información.
    """
    return crud_evento.obtener_eventos_activos(db, skip=skip, limit=limit)

@router.get("/{id_evento}", response_model=EventoResponse, status_code=status.HTTP_200_OK)
def obtener_detalle_evento(id_evento: int, db: Session = Depends(get_db)):
    """
    Obtiene la vista detallada de un evento específico mediante su ID.
    Utilizado por el frontend cuando un usuario hace clic en una tarjeta de evento.
    """
    evento = crud_evento.obtener_evento_por_id(db, id_evento)
    if not evento:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="El evento solicitado no existe o fue eliminado.")
    return evento


# ==============================================================================
# SECCIÓN PARA EL ADMINISTRADOR (PANEL DE CONTROL / DASHBOARD)
# Operaciones críticas de escritura (POST, PUT, DELETE). 
# TODAS requieren la dependencia 'verificar_rol_administrador' activa.
# ==============================================================================

@router.post("/", response_model=EventoResponse, status_code=status.HTTP_201_CREATED)
def registrar_evento(
    evento_in: EventoCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    id_usuario: int = Depends(obtener_id_usuario_gateway),
    rol_validado: int = Depends(verificar_rol_administrador) # <-- CANDADO ADMINISTRATIVO
):
    """
    Crea un nuevo evento en el calendario académico.
    Este proceso incluye la creación en base de datos y el disparo asíncrono 
    de notificaciones Push para no bloquear el tiempo de respuesta del servidor.
    """
    # 1. Persistencia inicial: Guardamos los datos base del evento
    nuevo_evento = crud_evento.crear_evento(db, evento=evento_in, id_usuario_token=id_usuario)
    
    # 2. Carga ansiosa (Eager Loading) manual: 
    # Buscamos el objeto Ubicación completo para satisfacer el esquema EventoResponse 
    # y evitar el error 500 de Pydantic por campos faltantes.
    from app.models.ubicacion import Ubicacion
    ubicacion_obj = db.query(Ubicacion).filter(Ubicacion.id_ubicacion == nuevo_evento.id_ubicacion).first()
    nuevo_evento.ubicacion = ubicacion_obj
    
    # 3. Tareas en segundo plano: Disparamos la notificación MQTT/Push 
    # mientras FastAPI ya le está respondiendo '201 Created' al administrador.
    background_tasks.add_task(enviar_alerta_nuevo_evento, nuevo_evento)
    
    return nuevo_evento

@router.put("/{id_evento}", response_model=EventoResponse, status_code=status.HTTP_200_OK)
def actualizar_datos_evento(
    id_evento: int,
    evento_in: EventoUpdate,
    db: Session = Depends(get_db),
    id_usuario: int = Depends(obtener_id_usuario_gateway),
    rol_validado: int = Depends(verificar_rol_administrador) # <-- CANDADO ADMINISTRATIVO
):
    """
    Permite corregir errores tipográficos, cambiar fechas o actualizar el estado 
    (ej. pasar de PROGRAMADO a EN_PROGRESO) de un evento ya existente.
    """
    evento_existente = crud_evento.obtener_evento_por_id(db, id_evento)
    if not evento_existente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No se puede actualizar. Evento no encontrado.")
    
    return crud_evento.actualizar_evento(db, db_evento=evento_existente, evento_in=evento_in)

@router.delete("/{id_evento}", response_model=EventoResponse, status_code=status.HTTP_200_OK)
def cancelar_evento(
    id_evento: int,
    db: Session = Depends(get_db),
    id_usuario: int = Depends(obtener_id_usuario_gateway),
    rol_validado: int = Depends(verificar_rol_administrador) # <-- CANDADO ADMINISTRATIVO
):
    """
    Realiza un borrado lógico (Soft Delete).
    No elimina el registro de la base de datos para mantener el historial,
    simplemente cambia su estado interno a CANCELADO.
    """
    evento_existente = crud_evento.obtener_evento_por_id(db, id_evento)
    if not evento_existente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No se puede cancelar. Evento no encontrado.")
    
    # Previene la sobreescritura si el evento ya fue dado de baja previamente
    if evento_existente.estado == ProgresoEvento.CANCELADO:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El evento ya se encuentra en estado cancelado.")
        
    return crud_evento.eliminar_evento(db, db_evento=evento_existente)