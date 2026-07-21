from sqlalchemy.orm import Session
from sqlalchemy import text

def inicializar_datos_maestros(db: Session) -> None:
    try:
        db.execute(text(
            "ALTER TABLE sensores ALTER COLUMN id_ubicacion DROP NOT NULL;"
        ))
        db.commit()
        print("[DATA-SEED] ✓ Columna id_ubicacion modificada a nullable en sensores.")
    except Exception:
        db.rollback()
        print("[DATA-SEED] - Columna id_ubicacion ya es nullable o no existe.")
