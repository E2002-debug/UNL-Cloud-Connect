from sqlalchemy.orm import Session
from app.models.auditoria import AuditoriaUsuario
from app.schemas.auditoria import AuditoriaCreate

def registrar_auditoria(db: Session, auditoria: AuditoriaCreate):
    db_auditoria = AuditoriaUsuario(**auditoria.model_dump())
    db.add(db_auditoria)
    db.commit()
    db.refresh(db_auditoria)
    return db_auditoria

def obtener_auditoria(db: Session, skip: int = 0, limit: int = 100):
    return db.query(AuditoriaUsuario).order_by(AuditoriaUsuario.fecha_hora.desc()).offset(skip).limit(limit).all()
