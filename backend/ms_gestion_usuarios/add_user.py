from app.database.session import SessionLocal
from app.crud.crud_usuario import crear_usuario
from app.schemas.usuario import UsuarioCreate
from datetime import date

def main():
    db = SessionLocal()
    try:
        user_data = UsuarioCreate(
            nombre="Usuario",
            apellido="Demo",
            correo="usuario.demo@unl.edu.ec",
            clave="Password123!",
            fecha_nacimiento=date(2000, 1, 1),
            id_rol=2
        )
        user = crear_usuario(db, user_data, verificado=True)
        print(f"Usuario creado exitosamente: {user.correo}")
    except Exception as e:
        print(f"Error al crear usuario: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
