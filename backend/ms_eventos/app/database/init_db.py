from sqlalchemy.orm import Session
from sqlalchemy import text

def ejecutar_migraciones(db: Session) -> None:
    try:
        db.execute(text(
            "ALTER TABLE ubicacion ADD COLUMN IF NOT EXISTS id_usuario_creador INTEGER NOT NULL DEFAULT 1;"
        ))
        db.execute(text(
            "ALTER TABLE ubicacion ADD COLUMN IF NOT EXISTS id_rol_creador INTEGER NOT NULL DEFAULT 2;"
        ))
        db.execute(text(
            "ALTER TABLE ubicacion ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;"
        ))
        db.commit()
        print("[MIGRACION] ✓ Columnas id_usuario_creador, id_rol_creador y activo agregadas a ubicacion.")
    except Exception:
        db.rollback()
        print("[MIGRACION] - Columnas ya existen o no se pudieron agregar.")
