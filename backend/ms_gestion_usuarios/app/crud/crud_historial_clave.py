from sqlalchemy.orm import Session
from app.models.historial_clave import HistorialClave
from app.core.security import verificar_clave

HISTORIAL_LIMITE = 5  # Número de contraseñas anteriores a recordar

def verificar_reutilizacion_clave(db: Session, id_usuario: int, nueva_clave_plana: str) -> bool:
    """
    Retorna True si la nueva clave ya fue usada anteriormente.
    Compara contra las últimas HISTORIAL_LIMITE contraseñas almacenadas.
    """
    historial = (
        db.query(HistorialClave)
        .filter(HistorialClave.id_usuario == id_usuario)
        .order_by(HistorialClave.fecha_cambio.desc())
        .limit(HISTORIAL_LIMITE)
        .all()
    )
    for entrada in historial:
        if verificar_clave(nueva_clave_plana, entrada.clave_hash):
            return True
    return False

def guardar_clave_en_historial(db: Session, id_usuario: int, clave_hash: str):
    """
    Guarda el hash de la nueva contraseña en el historial.
    Si se supera el límite, elimina las más antiguas automáticamente.
    """
    nueva_entrada = HistorialClave(id_usuario=id_usuario, clave_hash=clave_hash)
    db.add(nueva_entrada)
    db.flush()

    # Eliminar entradas más antiguas que superen el límite
    ids_a_mantener = (
        db.query(HistorialClave.id_historial)
        .filter(HistorialClave.id_usuario == id_usuario)
        .order_by(HistorialClave.fecha_cambio.desc())
        .limit(HISTORIAL_LIMITE)
        .subquery()
    )
    db.query(HistorialClave).filter(
        HistorialClave.id_usuario == id_usuario,
        ~HistorialClave.id_historial.in_(ids_a_mantener)
    ).delete(synchronize_session=False)
    db.commit()
