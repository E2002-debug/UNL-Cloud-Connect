from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Any
from app.database.session import get_db
from app.schemas.usuario import UsuarioResponse, UsuarioUpdate, UsuarioUpdateMe
from app.crud import crud_usuario
from app.core.deps import get_current_admin, get_current_user
from app.core.security import obtener_hash_clave
from app.crud.crud_auditoria import registrar_auditoria
from app.schemas.auditoria import AuditoriaCreate

router = APIRouter(
    prefix="/usuarios",
    tags=["Gestión de Usuarios (Admin)"]
)

@router.put("/me", response_model=UsuarioResponse)
def actualizar_mi_perfil(
    request: Request,
    usuario_in: UsuarioUpdateMe,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Any:
    """
    Actualiza la información del usuario autenticado (nombre, apellido, clave).
    """
    datos_actualizar = usuario_in.model_dump(exclude_unset=True)
    cambio_clave = False
    if "clave" in datos_actualizar and datos_actualizar["clave"]:
        datos_actualizar["clave"] = obtener_hash_clave(datos_actualizar["clave"])
        cambio_clave = True
    
    usuario_actualizado = crud_usuario.actualizar_usuario(db, db_usuario=current_user, datos_actualizar=datos_actualizar)

    accion = "CAMBIO_CLAVE" if cambio_clave else "ACTUALIZACION_PERFIL"
    registrar_auditoria(db, AuditoriaCreate(
        id_usuario=current_user.id_usuario,
        correo=current_user.correo,
        accion=accion,
        ip_origen=request.client.host if request.client else None,
        detalles=f"El usuario actualizó su {'contraseña' if cambio_clave else 'perfil'}"
    ))
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
    request: Request,
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
    
    if id_usuario == admin_user.id_usuario and usuario_in.id_rol == 2:
        raise HTTPException(status_code=400, detail="No puedes quitarte tu propio rol de administrador")

    rol_anterior = usuario_db.id_rol
    datos_actualizar = usuario_in.model_dump(exclude_unset=True)
    usuario_actualizado = crud_usuario.actualizar_usuario(db, db_usuario=usuario_db, datos_actualizar=datos_actualizar)

    # Determinar si fue cambio de rol o modificación general
    if "id_rol" in datos_actualizar and datos_actualizar["id_rol"] != rol_anterior:
        accion = "CAMBIO_ROL"
        detalles = f"Rol cambiado de {rol_anterior} a {datos_actualizar['id_rol']} en usuario: {usuario_db.correo}"
    else:
        accion = "MODIFICACION_USUARIO"
        detalles = f"Admin modificó datos del usuario: {usuario_db.correo}"

    registrar_auditoria(db, AuditoriaCreate(
        id_usuario=admin_user.id_usuario,
        correo=admin_user.correo,
        accion=accion,
        ip_origen=request.client.host if request.client else None,
        detalles=detalles
    ))
    return usuario_actualizado

@router.delete("/{id_usuario}", response_model=dict)
def eliminar_usuario_endpoint(
    id_usuario: int,
    request: Request,
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

    correo_eliminado = usuario_db.correo
    crud_usuario.eliminar_usuario(db, db_usuario=usuario_db)

    registrar_auditoria(db, AuditoriaCreate(
        id_usuario=admin_user.id_usuario,
        correo=admin_user.correo,
        accion="ELIMINACION_USUARIO",
        ip_origen=request.client.host if request.client else None,
        detalles=f"Admin eliminó la cuenta del usuario: {correo_eliminado}"
    ))
    return {"mensaje": "Usuario eliminado correctamente"}
