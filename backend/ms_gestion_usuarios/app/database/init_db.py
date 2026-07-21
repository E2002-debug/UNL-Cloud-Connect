# Autor: David Guamán
# Fecha: 24/05/2026
# Version: 1.0
# 24/05/2026 - David Guamán: Script de sembrado automático (Data Seeding) para poblar las tablas maestras.

from sqlalchemy.orm import Session
from app.models.usuario import Rol

def inicializar_datos_maestros(db: Session) -> None:
    """
    Verifica individualmente la existencia de cada rol obligatorio.
    Inserta únicamente los roles que falten en el sistema.
    """
    try:
        # 1. Definimos el diccionario exacto de cómo queremos que esté el sistema
        roles_requeridos = [
            {"id_rol": 1, "nombre_rol": "Administrador"},
            {"id_rol": 2, "nombre_rol": "Participante"},
            {"id_rol": 3, "nombre_rol": "Superadmin"},
        ]
        
        roles_agregados = 0
        
        # 2. Iteramos sobre cada rol que necesitamos
        for rol_data in roles_requeridos:
            # Buscamos si ESTE rol específico ya existe por su ID
            rol_existente = db.query(Rol).filter(Rol.id_rol == rol_data["id_rol"]).first()
            
            # 3. Si no existe, lo preparamos para guardarlo
            if not rol_existente:
                nuevo_rol = Rol(id_rol=rol_data["id_rol"], nombre_rol=rol_data["nombre_rol"])
                db.add(nuevo_rol)
                roles_agregados += 1
                print(f"[DATA-SEED] Preparando inserción de rol faltante: {rol_data['nombre_rol']}")

        # 4. Si encontramos que faltaba al menos uno, hacemos el commit a la base de datos
        if roles_agregados > 0:
            db.commit()
            print(f"[DATA-SEED] ✓ Sincronización completada. Se agregaron {roles_agregados} roles.")
        else:
            print("[DATA-SEED] ✓ Todos los roles maestros ya están completos. Omitiendo.")
            
        # 5. Parche de base de datos para asegurar que el registro con Google (sin contraseña) funcione
        from sqlalchemy import text
        try:
            # Eliminar restricción NOT NULL de la clave
            db.execute(text("ALTER TABLE usuario ALTER COLUMN clave DROP NOT NULL;"))
            
            # Agregar la columna 'verificado' si no existe (agregada en la v0.4)
            db.execute(text("ALTER TABLE usuario ADD COLUMN IF NOT EXISTS verificado BOOLEAN DEFAULT FALSE NOT NULL;"))
            
            db.commit()
            print("[DATA-SEED] ✓ Parches aplicados: clave nullable y columna verificado asegurada.")

        except Exception:
            db.rollback()
            # Ignoramos silenciosamente si la tabla o la columna no existe aún
            pass
            
    except Exception as e:
        db.rollback()
        print(f"[DATA-SEED-ERROR] No se pudieron sincronizar los datos base: {e}")