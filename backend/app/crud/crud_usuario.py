from sqlalchemy.orm import Session
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate
from app.core.security import obtener_hash_clave

def obtener_usuario_por_correo(db: Session, correo: str):
    """
    Busca un usuario en la base de datos por su correo electrónico.
    Esencial para validar que no existan cuentas duplicadas antes del registro (HU_01)
    y para autenticar al usuario durante el inicio de sesión (HU_02).
    """
    return db.query(Usuario).filter(Usuario.correo == correo).first()

def crear_usuario(db: Session, usuario: UsuarioCreate):
    """
    Crea un nuevo usuario en la base de datos.
    Aplica el hash a la contraseña antes de persistir los datos por seguridad.
    """
    # Encriptar la contraseña si se proporcionó una (soporte para flujo híbrido)
    clave_encriptada = obtener_hash_clave(usuario.clave) if usuario.clave else None
    
    # Instanciar el modelo de SQLAlchemy mapeando los datos del esquema de Pydantic
    db_usuario = Usuario(
        nombre=usuario.nombre,
        apellido=usuario.apellido,
        correo=usuario.correo,
        clave=clave_encriptada,
        fecha_nacimiento=usuario.fecha_nacimiento,
        id_rol=usuario.id_rol
    )
    
    # Persistir en la base de datos
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    
    return db_usuario