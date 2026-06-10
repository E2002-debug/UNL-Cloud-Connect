from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any
from app.database.session import get_db
from app.schemas.usuario import UsuarioResponse, UsuarioUpdate, UsuarioUpdateMe
from app.crud import crud_usuario
from app.core.deps import get_current_admin, get_current_user
from app.core.security import obtener_hash_clave

router = APIRouter(
    prefix="/usuarios",
    tags=["Gestión de Usuarios (Admin)"]
)

@router.put("/me", response_model=UsuarioResponse)
def actualizar_mi_perfil(
    usuario_in: UsuarioUpdateMe,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Any:
    """
    Actualiza la información del usuario autenticado (nombre, apellido, clave).
    """
    datos_actualizar = usuario_in.model_dump(exclude_unset=True)
    if "clave" in datos_actualizar and datos_actualizar["clave"]:
        datos_actualizar["clave"] = obtener_hash_clave(datos_actualizar["clave"])
    
    usuario_actualizado = crud_usuario.actualizar_usuario(db, db_usuario=current_user, datos_actualizar=datos_actualizar)
    return usuario_actualizado

@router.get("/", response_model=List[UsuarioResponse])
def listar_usuarios(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin)
) -> Any:
    """
    Obtiene la lista de todos los usuarios.
    Ruta protegida: Solo accesible por Administradores.
    """
    usuarios = crud_usuario.obtener_usuarios(db, skip=skip, limit=limit)
    return usuarios

@router.put("/{id_usuario}", response_model=UsuarioResponse)
def actualizar_usuario_endpoint(
    id_usuario: int,
    usuario_in: UsuarioUpdate,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin)
) -> Any:
    """
    Actualiza la información de un usuario (ej. rol, nombre).
    Ruta protegida: Solo accesible por Administradores.
    """
    usuario_db = crud_usuario.obtener_usuario_por_id(db, id_usuario=id_usuario)
    if not usuario_db:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Prevenir que el admin se quite su propio rol de admin (opcional pero recomendado)
    if id_usuario == admin_user.id_usuario and usuario_in.id_rol == 2:
        raise HTTPException(status_code=400, detail="No puedes quitarte tu propio rol de administrador")

    datos_actualizar = usuario_in.model_dump(exclude_unset=True)
    usuario_actualizado = crud_usuario.actualizar_usuario(db, db_usuario=usuario_db, datos_actualizar=datos_actualizar)
    return usuario_actualizado

@router.delete("/{id_usuario}", response_model=dict)
def eliminar_usuario_endpoint(
    id_usuario: int,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin)
) -> Any:
    """
    Elimina un usuario del sistema.
    Ruta protegida: Solo accesible por Administradores.
    """
    usuario_db = crud_usuario.obtener_usuario_por_id(db, id_usuario=id_usuario)
    if not usuario_db:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    if id_usuario == admin_user.id_usuario:
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propia cuenta de administrador")

    crud_usuario.eliminar_usuario(db, db_usuario=usuario_db)
    return {"mensaje": "Usuario eliminado correctamente"}
