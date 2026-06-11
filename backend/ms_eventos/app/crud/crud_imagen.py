from sqlalchemy.orm import Session
from app.models.imagen import ImagenEvento, Reaccion, TipoReaccion

def crear_registro_imagen(db: Session, id_evento: int,id_usuario: int, url_minio: str):
    """
    Guarda la referencia de la imagen asociada al evento en PostgreSQL.
    """
    db_imagen = ImagenEvento(
        id_evento=id_evento,
        id_usuario=id_usuario,
        url_minio=url_minio
    )
    
    db.add(db_imagen)
    db.commit()
    db.refresh(db_imagen)
    
    return db_imagen


def procesar_reaccion(db: Session, id_imagen: int, id_usuario: int, tipo_nuevo: TipoReaccion):
    """
    Gestiona el clic del usuario en los botones de interacción.
    Maneja Insert, Update y Delete dinámicamente.
    """
    reaccion_existente = db.query(Reaccion).filter(
        Reaccion.id_imagen == id_imagen,
        Reaccion.id_usuario == id_usuario
    ).first()

    # Escenario 1: No tenía registro previo -> SE INSERTA
    if not reaccion_existente:
        nueva_reaccion = Reaccion(id_imagen=id_imagen, id_usuario=id_usuario, tipo=tipo_nuevo)
        db.add(nueva_reaccion)
        db.commit()
        return {"accion": "agregado", "estado_actual": tipo_nuevo}

    # Escenario 2: Ya tenía la MISMA reacción -> SE ELIMINA (Quitar Like)
    if reaccion_existente.tipo == tipo_nuevo:
        db.delete(reaccion_existente)
        db.commit()
        return {"accion": "eliminado", "estado_actual": None}

    # Escenario 3: Ya tenía una reacción DIFERENTE -> SE ACTUALIZA (Cambió de opinión)
    reaccion_existente.tipo = tipo_nuevo
    db.commit()
    return {"accion": "actualizado", "estado_actual": tipo_nuevo}


def obtener_resumen_reacciones(db: Session, id_imagen: int):
    """
    Agrupa las reacciones para que el frontend las pinte.
    """
    reacciones = db.query(Reaccion).filter(Reaccion.id_imagen == id_imagen).all()

    # Filtramos por tipo usando comprensión de listas para extraer solo los IDs de usuario
    lista_me_gusta = [r.id_usuario for r in reacciones if r.tipo == TipoReaccion.ME_GUSTA]
    lista_no_me_gusta = [r.id_usuario for r in reacciones if r.tipo == TipoReaccion.NO_ME_GUSTA]

    return {
        "total_me_gusta": len(lista_me_gusta),
        "total_no_me_gusta": len(lista_no_me_gusta),
        "usuarios_me_gusta": lista_me_gusta,
        "usuarios_no_me_gusta": lista_no_me_gusta
    }