# Autor: David Guamán
# Fecha: 20/05/2026
# Version: 0.1
# Historial:
# 20/05/2026 v0.1 - David Guamán: Creación de funciones CRUD para gestionar usuarios, incluyendo búsqueda por correo y guardado con encriptación de contraseña.

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

def crear_usuario(db: Session, usuario: UsuarioCreate, verificado: bool = False):
    """
    Crea un nuevo usuario en la base de datos.
    Aplica el hash a la contraseña antes de persistir los datos por seguridad.
    Valida que el rol sea uno de los roles válidos (1: Administrador, 2: Participante).
    El parámetro verificado permite marcar usuarios de Google como verificados automáticamente.
    """
    # Validar que el id_rol sea válido (solo 1: Administrador o 2: Participante)
    if usuario.id_rol not in [1, 2, 3]:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El rol debe ser 1 (Administrador), 2 (Participante) o 3 (Superadmin)."
        )
    
    # Encriptar la contraseña si se proporcionó una (soporte para flujo híbrido)
    clave_encriptada = obtener_hash_clave(usuario.clave) if usuario.clave else None
    
    # Instanciar el modelo de SQLAlchemy mapeando los datos del esquema de Pydantic
    db_usuario = Usuario(
        nombre=usuario.nombre,
        apellido=usuario.apellido,
        correo=usuario.correo,
        clave=clave_encriptada,
        fecha_nacimiento=usuario.fecha_nacimiento,
        id_rol=usuario.id_rol,
        verificado=verificado
    )
    
    # Persistir en la base de datos
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    
    return db_usuario

def obtener_usuarios(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Usuario).offset(skip).limit(limit).all()

def obtener_usuario_por_id(db: Session, id_usuario: int):
    return db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()

def actualizar_usuario(db: Session, db_usuario: Usuario, datos_actualizar: dict):
    for key, value in datos_actualizar.items():
        if value is not None:
            setattr(db_usuario, key, value)
    db.commit()
    db.refresh(db_usuario)
    return db_usuario

def eliminar_usuario(db: Session, db_usuario: Usuario):
    db.delete(db_usuario)
    db.commit()
    return db_usuario