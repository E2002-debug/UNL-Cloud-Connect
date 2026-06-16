from datetime import datetime, timezone
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import asc
from app.models.evento import Evento, ProgresoEvento
from app.models.imagen import ImagenEvento
from app.schemas.evento import EventoCreate, EventoUpdate

# =====================================================================
# Auto-transición de estados según fecha
# =====================================================================

def actualizar_estados_por_fecha(db: Session):
    ahora = datetime.now(timezone.utc)

    eventos_terminados = db.query(Evento).filter(
        Evento.fecha_hora_final < ahora,
        Evento.estado.in_([ProgresoEvento.PROGRAMADO, ProgresoEvento.EN_PROGRESO])
    ).all()
    for evento in eventos_terminados:
        evento.estado = ProgresoEvento.FINALIZADO

    eventos_en_curso = db.query(Evento).filter(
        Evento.fecha_hora_inicio <= ahora,
        Evento.fecha_hora_final > ahora,
        Evento.estado == ProgresoEvento.PROGRAMADO
    ).all()
    for evento in eventos_en_curso:
        evento.estado = ProgresoEvento.EN_PROGRESO

    db.commit()

# =====================================================================
# Paso 3.2: CRUD de Visualización (HU_03 - Estudiantes y Participantes)
# =====================================================================

def obtener_evento_por_id(db: Session, id_evento: int):
    """
    Busca un evento específico por su ID e incluye su imagen principal.
    """
    actualizar_estados_por_fecha(db)
    evento = db.query(Evento).options(selectinload(Evento.imagenes)).filter(Evento.id_evento == id_evento).first()
    if evento:
        evento.imagen_url = evento.imagenes[0].url_minio if evento.imagenes else None
    return evento

def obtener_eventos_activos(db: Session, skip: int = 0, limit: int = 100):
    """
    Retorna el feed completo de eventos (incluye CANCELADOS y FINALIZADOS)
    para que administradores vean el ciclo de vida completo.
    Incluye la URL de la primera imagen de cada evento.
    """
    actualizar_estados_por_fecha(db)
    eventos = db.query(Evento)\
                .options(selectinload(Evento.imagenes))\
                .order_by(asc(Evento.fecha_hora_inicio))\
                .offset(skip)\
                .limit(limit)\
                .all()
    for evento in eventos:
        evento.imagen_url = evento.imagenes[0].url_minio if evento.imagenes else None
    return eventos


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