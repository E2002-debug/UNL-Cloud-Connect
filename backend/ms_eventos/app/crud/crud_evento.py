from sqlalchemy.orm import Session
from sqlalchemy import asc
from app.models.evento import Evento, ProgresoEvento
from app.schemas.evento import EventoCreate, EventoUpdate

# =====================================================================
# Paso 3.2: CRUD de Visualización (HU_03 - Estudiantes y Participantes)
# =====================================================================

def obtener_evento_por_id(db: Session, id_evento: int):
    """
    Busca un evento específico por su ID.
    """
    return db.query(Evento).filter(Evento.id_evento == id_evento).first()

def obtener_eventos_activos(db: Session, skip: int = 0, limit: int = 100):
    """
    Retorna el feed de eventos. Excluye los CANCELADOS y ordena cronológicamente.
    """
    return db.query(Evento)\
             .filter(Evento.estado != ProgresoEvento.CANCELADO)\
             .order_by(asc(Evento.fecha_hora_inicio))\
             .offset(skip)\
             .limit(limit)\
             .all()


# =====================================================================
# Paso 3.1: CRUD de Gestión (HU_011 - Administradores)
# =====================================================================

def crear_evento(db: Session, evento: EventoCreate, id_usuario_token: int):
    """
    Persiste un nuevo evento.
    El id_usuario llega validado y seguro desde el token JWT en el router.
    """
    # Usamos **kwargs para desempaquetar el esquema de forma elegante
    db_evento = Evento(
        **evento.model_dump(),
        id_usuario=id_usuario_token
    )
    
    db.add(db_evento)
    db.commit()
    db.refresh(db_evento)
    
    return db_evento

def actualizar_evento(db: Session, db_evento: Evento, evento_in: EventoUpdate):
    """
    Actualiza parcialmente un evento ignorando campos no enviados (unset).
    """
    update_data = evento_in.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_evento, field, value)
        
    db.add(db_evento)
    db.commit()
    db.refresh(db_evento)
    
    return db_evento

def eliminar_evento(db: Session, db_evento: Evento):
    """
    Implementación de Soft Delete (Borrado Lógico).
    En lugar de eliminar el registro, lo marcamos como CANCELADO para preservar integridad y analíticas.
    """
    db_evento.estado = ProgresoEvento.CANCELADO
    
    db.add(db_evento)
    db.commit()
    db.refresh(db_evento)
    
    return db_evento