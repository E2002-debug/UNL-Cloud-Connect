"""
Módulo de Enrutamiento: Gestión de Eventos
Este archivo define los endpoints del microservicio de eventos. 
Implementa arquitectura Zero Trust confiando en los headers inyectados por el API Gateway (Kong)
y separa claramente las operaciones de lectura (públicas/clientes) de las de escritura (administradores).
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header, BackgroundTasks, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
import filetype

from app.services.notificaciones import enviar_alerta_nuevo_evento 
from app.database.session import get_db
from app.schemas.evento import EventoCreate, EventoUpdate, EventoResponse
from app.models.evento import ProgresoEvento  
from app.schemas.imagen import ReaccionRequest, ReaccionesResumenResponse, ReportarImagenRequest, ImagenReportadaResponse
from app.models.imagen import ImagenEvento
from app.services.almacenamiento import subir_imagen_minio, eliminar_imagen_minio
from app.crud import crud_evento
from app.crud import crud_imagen

router = APIRouter(
    prefix="/eventos",
    tags=["Gestión de Eventos"]
)

# ==============================================================================
# DEPENDENCIAS DE SEGURIDAD (INTEGRACIÓN CON API GATEWAY - KONG)
# ==============================================================================

def obtener_id_usuario_gateway(x_user_id: str = Header(..., alias="x-user-id", description="ID inyectado por Kong")) -> int:
    """
    Extrae el ID del usuario autenticado desde los encabezados de la petición.
    En una arquitectura de microservicios, el Gateway (Kong) ya validó el JWT, 
    por lo que aquí solo interceptamos el ID resultante.
    """
    if not x_user_id.isdigit():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no autenticado correctamente por el Gateway.")
    return int(x_user_id)

def verificar_rol_administrador(x_user_role: str = Header(..., alias="x-user-role", description="Rol inyectado por Kong")) -> int:
    """
    Filtro de Control de Acceso Basado en Roles (RBAC).
    Bloquea la petición inmediatamente si el rol inyectado no corresponde al ID 1 (Administrador).
    """
    if x_user_role != "1":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Acceso denegado. Se requieren privilegios de Administrador para realizar modificaciones."
        )
    return int(x_user_role)


# ==============================================================================
# SECCIÓN PARA EL CLIENTE (APLICACIÓN MÓVIL / ESTUDIANTES / DOCENTES)
# Operaciones de solo lectura (GET). No requieren validación estricta de roles.
# ==============================================================================

@router.get("/activos", response_model=List[EventoResponse], status_code=status.HTTP_200_OK)
def listar_eventos_activos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Endpoint de consumo masivo para el feed principal de la aplicación.
    Retorna la lista de eventos que están actualmente en curso o programados.
    Cualquier usuario autenticado en la red puede consultar esta información.
    """
    return crud_evento.obtener_eventos_activos(db, skip=skip, limit=limit)

@router.get("/{id_evento}", response_model=EventoResponse, status_code=status.HTTP_200_OK)
def obtener_detalle_evento(id_evento: int, db: Session = Depends(get_db)):
    """
    Obtiene la vista detallada de un evento específico mediante su ID.
    Utilizado por el frontend cuando un usuario hace clic en una tarjeta de evento.
    """
    evento = crud_evento.obtener_evento_por_id(db, id_evento)
    if not evento:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="El evento solicitado no existe o fue eliminado.")
    return evento


# ==============================================================================
# SECCIÓN PARA EL ADMINISTRADOR (PANEL DE CONTROL / DASHBOARD)
# Operaciones críticas de escritura (POST, PUT, DELETE). 
# TODAS requieren la dependencia 'verificar_rol_administrador' activa.
# ==============================================================================

@router.post("/", response_model=EventoResponse, status_code=status.HTTP_201_CREATED)
def registrar_evento(
    evento_in: EventoCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    id_usuario: int = Depends(obtener_id_usuario_gateway),
    rol_validado: int = Depends(verificar_rol_administrador) # <-- CANDADO ADMINISTRATIVO
):
    """
    Crea un nuevo evento en el calendario académico.
    Este proceso incluye la creación en base de datos y el disparo asíncrono 
    de notificaciones Push para no bloquear el tiempo de respuesta del servidor.
    """
    # 1. Persistencia inicial: Guardamos los datos base del evento
    nuevo_evento = crud_evento.crear_evento(db, evento=evento_in, id_usuario_token=id_usuario)
    
    # 2. Carga ansiosa (Eager Loading) manual: 
    # Buscamos el objeto Ubicación completo para satisfacer el esquema EventoResponse 
    # y evitar el error 500 de Pydantic por campos faltantes.
    from app.models.ubicacion import Ubicacion
    ubicacion_obj = db.query(Ubicacion).filter(Ubicacion.id_ubicacion == nuevo_evento.id_ubicacion).first()
    nuevo_evento.ubicacion = ubicacion_obj
    
    # 3. Tareas en segundo plano: Disparamos la notificación MQTT/Push 
    # mientras FastAPI ya le está respondiendo '201 Created' al administrador.
    background_tasks.add_task(enviar_alerta_nuevo_evento, nuevo_evento)
    
    return nuevo_evento

@router.put("/{id_evento}", response_model=EventoResponse, status_code=status.HTTP_200_OK)
def actualizar_datos_evento(
    id_evento: int,
    evento_in: EventoUpdate,
    db: Session = Depends(get_db),
    id_usuario: int = Depends(obtener_id_usuario_gateway),
    rol_validado: int = Depends(verificar_rol_administrador) # <-- CANDADO ADMINISTRATIVO
):
    """
    Permite corregir errores tipográficos, cambiar fechas o actualizar el estado 
    (ej. pasar de PROGRAMADO a EN_PROGRESO) de un evento ya existente.
    """
    evento_existente = crud_evento.obtener_evento_por_id(db, id_evento)
    if not evento_existente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No se puede actualizar. Evento no encontrado.")
    
    if evento_existente.id_usuario != id_usuario:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No eres el dueño de este evento, por eso no se puede modificar.")
    
    return crud_evento.actualizar_evento(db, db_evento=evento_existente, evento_in=evento_in)

@router.delete("/{id_evento}", response_model=EventoResponse, status_code=status.HTTP_200_OK)
def cancelar_evento(
    id_evento: int,
    db: Session = Depends(get_db),
    id_usuario: int = Depends(obtener_id_usuario_gateway),
    rol_validado: int = Depends(verificar_rol_administrador) # <-- CANDADO ADMINISTRATIVO
):
    """
    Realiza un borrado lógico (Soft Delete).
    No elimina el registro de la base de datos para mantener el historial,
    simplemente cambia su estado interno a CANCELADO.
    """
    evento_existente = crud_evento.obtener_evento_por_id(db, id_evento)
    if not evento_existente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No se puede cancelar. Evento no encontrado.")
    
    if evento_existente.id_usuario != id_usuario:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No eres el dueño de este evento, por eso no se puede cancelar.")
    
    # Previene la sobreescritura si el evento ya fue dado de baja previamente
    if evento_existente.estado == ProgresoEvento.CANCELADO:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El evento ya se encuentra en estado cancelado.")
        
    return crud_evento.eliminar_evento(db, db_evento=evento_existente)

@router.delete("/{id_evento}/fisico", status_code=status.HTTP_200_OK)
def eliminar_evento_fisicamente(
    id_evento: int,
    db: Session = Depends(get_db),
    id_usuario: int = Depends(obtener_id_usuario_gateway),
    rol_validado: int = Depends(verificar_rol_administrador)
):
    """
    Realiza un borrado físico (Hard Delete).
    Elimina permanentemente el evento de la base de datos.
    """
    evento_existente = crud_evento.obtener_evento_por_id(db, id_evento)
    if not evento_existente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No se puede eliminar. Evento no encontrado.")
    
    if evento_existente.id_usuario != id_usuario:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No eres el dueño de este evento, por eso no se puede eliminar.")
    
    crud_evento.borrar_evento_fisico(db, db_evento=evento_existente)
    return {"mensaje": "Evento eliminado permanentemente."}


# ==========================================
# VALIDACIONES DE LA ADUANA (HU_05)
# ==========================================

def validar_imagen(imagen: UploadFile = File(...)) -> UploadFile:
    """
    Filtro estricto para proteger el bucket de MinIO.
    Verifica MIME type real (Magic Numbers) y límite de peso (5MB).
    """
    # 1. Validación de Formato (Prevención de MIME Spoofing)
    # Leemos los primeros 2048 bytes para analizar la firma del archivo
    chunk = imagen.file.read(2048)
    
    # Rebobinamos el archivo para que MinIO pueda leerlo desde el inicio
    imagen.file.seek(0)
    
    tipo_archivo = filetype.guess(chunk)
    if tipo_archivo is None:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="No se pudo determinar el tipo de archivo o está corrupto."
        )
        
    formatos_permitidos = ["image/jpeg", "image/png", "image/webp"]
    if tipo_archivo.mime not in formatos_permitidos:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Formato detectado ({tipo_archivo.mime}) no está permitido. Solo se permiten archivos .jpg, .png o .webp"
        )
    
    # 2. Validación de Tamaño (5MB = 5 * 1024 * 1024 bytes)
    # UploadFile.size está disponible de forma nativa en FastAPI moderno
    LIMITE_MB = 5
    if imagen.size > LIMITE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"La imagen supera el límite máximo de {LIMITE_MB}MB."
        )
    
    return imagen

# ==========================================
# ENDPOINT IMAGEN (HU_04)
# ==========================================

@router.post("/{id_evento}/imagenes/", status_code=status.HTTP_201_CREATED)
def subir_imagen_a_evento(
    id_evento: int,
    imagen_validada: UploadFile = Depends(validar_imagen),
    db: Session = Depends(get_db),
    id_usuario: int = Depends(obtener_id_usuario_gateway)
):
    """
    Permite a los participantes subir una foto al evento.
    """
    evento_existente = crud_evento.obtener_evento_por_id(db, id_evento)
    if not evento_existente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="El evento solicitado no existe.")
    
    try:
        url_publica = subir_imagen_minio(imagen_validada)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al comunicar con el servidor de almacenamiento: {str(e)}"
        )
    
    nueva_imagen = crud_imagen.crear_registro_imagen(
        db=db, 
        id_evento=id_evento, 
        id_usuario=id_usuario,
        url_minio=url_publica
    )
    
    return {
        "mensaje": "Imagen procesada y enlazada exitosamente",
        "id_imagen": nueva_imagen.id_imagen,
        "url": nueva_imagen.url_minio
    }

# ==========================================
# ENDPOINT PÚBLICO: Listar imágenes de un evento
# ==========================================
@router.get("/{id_evento}/imagenes/", status_code=status.HTTP_200_OK)
def listar_imagenes_evento(
    id_evento: int,
    db: Session = Depends(get_db)
):
    """
    Retorna todas las imágenes subidas a un evento, ordenadas por fecha descendente.
    """
    evento_existente = crud_evento.obtener_evento_por_id(db, id_evento)
    if not evento_existente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="El evento solicitado no existe.")

    imagenes = crud_imagen.obtener_imagenes_por_evento(db, id_evento)
    return [
        {
            "id_imagen": img.id_imagen,
            "url": img.url_minio,
            "fecha_subida": img.fecha_subida.isoformat(),
            "id_usuario": img.id_usuario,
            "reportada": img.reportada,
            "motivo_reporte": img.motivo_reporte,
        }
        for img in imagenes
    ]


# ==========================================
# ENDPOINT PROTEGIDO: HU_06 (Interactuar)
# ==========================================
@router.post("/imagenes/{id_imagen}/reaccion", status_code=status.HTTP_200_OK)
def reaccionar_a_imagen(
    id_imagen: int,
    reaccion_in: ReaccionRequest,
    db: Session = Depends(get_db),
    # Extraemos el ID del estudiante/docente validado por el API Gateway
    id_usuario: int = Depends(obtener_id_usuario_gateway) 
):
    """
    Aplica Like, Dislike o remueve la interacción actual usando lógica Toggle.
    """
    # Verificamos que la imagen física exista
    imagen_existente = db.query(ImagenEvento).filter(ImagenEvento.id_imagen == id_imagen).first()
    if not imagen_existente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La imagen no existe.")
    
    try:
        resultado = crud_imagen.procesar_reaccion(
            db=db, 
            id_imagen=id_imagen, 
            id_usuario=id_usuario, 
            tipo_nuevo=reaccion_in.tipo
        )
        return {"mensaje": "Interacción procesada", "detalle": resultado}
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Reacción duplicada para este usuario e imagen. Conflicto de concurrencia."
        )

# ==========================================
# ENDPOINT PÚBLICO: HU_07 (Consultar)
# ==========================================
@router.get("/imagenes/{id_imagen}/reacciones", response_model=ReaccionesResumenResponse, status_code=status.HTTP_200_OK)
def obtener_interacciones_imagen(
    id_imagen: int,
    db: Session = Depends(get_db)
):
    """
    Devuelve los contadores y las listas de IDs de usuarios que reaccionaron.
    El frontend usará estos IDs para consultar los nombres a ms-usuarios si el usuario abre el modal.
    """
    # Verificamos existencia
    imagen_existente = db.query(ImagenEvento).filter(ImagenEvento.id_imagen == id_imagen).first()
    if not imagen_existente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La imagen no existe.")
        
    return crud_imagen.obtener_resumen_reacciones(db, id_imagen)


# ==========================================
# ENDPOINT: HU_11 - Reportar imagen (usuario)
# ==========================================
@router.post("/imagenes/{id_imagen}/reportar", status_code=status.HTTP_200_OK)
def reportar_imagen_endpoint(
    id_imagen: int,
    reporte_in: ReportarImagenRequest,
    db: Session = Depends(get_db),
    id_usuario: int = Depends(obtener_id_usuario_gateway)
):
    """
    Permite a un usuario reportar una imagen como inapropiada o fuera de contexto.
    La imagen no se elimina, queda marcada para revisión del administrador.
    """
    imagen_existente = db.query(ImagenEvento).filter(ImagenEvento.id_imagen == id_imagen).first()
    if not imagen_existente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La imagen no existe.")

    if imagen_existente.reportada:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Esta imagen ya ha sido reportada.")

    resultado = crud_imagen.reportar_imagen(db, id_imagen, reporte_in.motivo_reporte)

    return {"mensaje": "Imagen reportada exitosamente. Un administrador la revisará.", "id_imagen": id_imagen}


# ==========================================
# ENDPOINT ADMIN: Listar imágenes reportadas
# ==========================================
@router.get("/imagenes/reportadas", response_model=List[ImagenReportadaResponse], status_code=status.HTTP_200_OK)
def listar_imagenes_reportadas(
    db: Session = Depends(get_db),
    rol_validado: int = Depends(verificar_rol_administrador)
):
    """
    Retorna todas las imágenes que han sido marcadas como reportadas,
    incluyendo el nombre del evento al que pertenecen.
    """
    imagenes = crud_imagen.obtener_imagenes_reportadas(db)
    return [
        ImagenReportadaResponse(
            id_imagen=img.id_imagen,
            url=img.url_minio,
            fecha_subida=img.fecha_subida,
            id_usuario=img.id_usuario,
            id_evento=img.id_evento,
            evento_nombre=img.evento.nombre if img.evento else "Desconocido",
            motivo_reporte=img.motivo_reporte,
        )
        for img in imagenes
    ]


# ==========================================
# ENDPOINT ADMIN: Eliminar imagen (físico + DB)
# ==========================================
# @router.delete("/imagenes/{id_imagen}", status_code=status.HTTP_200_OK)
# def eliminar_imagen_endpoint(
#     id_imagen: int,
#     db: Session = Depends(get_db),
#     id_usuario: int = Depends(obtener_id_usuario_gateway),
#     rol_validado: int = Depends(verificar_rol_administrador)
# ):
#     """
#     Elimina físicamente la imagen de MinIO y su registro de la base de datos.
#     Poder absoluto del administrador.
#     """
#     imagen = crud_imagen.obtener_imagen_por_id(db, id_imagen)
#     if not imagen:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La imagen no existe.")

#     url_minio = crud_imagen.eliminar_registro_imagen(db, id_imagen)
#     if url_minio:
#         eliminar_imagen_minio(url_minio)

#     return {"mensaje": "Imagen eliminada permanentemente.", "id_imagen": id_imagen}
# ==========================================
# ENDPOINT: Eliminar imagen (participante o administrador)
# ==========================================
@router.delete("/imagenes/{id_imagen}", status_code=status.HTTP_200_OK)
def eliminar_imagen_endpoint(
    id_imagen: int,
    db: Session = Depends(get_db),
    id_usuario: int = Depends(obtener_id_usuario_gateway),
    x_user_role: str = Header(..., alias="x-user-role", description="Rol inyectado por Kong")
):
    """
    - Participante: solo puede eliminar SUS PROPIAS imágenes (no la portada del evento).
    - Administrador: puede eliminar imágenes de cualquier participante y las suyas,
      pero NUNCA la imagen de portada del evento (subida por el creador).
    """
    imagen = crud_imagen.obtener_imagen_por_id(db, id_imagen)
    if not imagen:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La imagen no existe.")

    # La portada es la imagen subida por el creador del evento -> nadie puede borrarla aquí
    es_portada_evento = imagen.id_usuario == imagen.evento.id_usuario
    if es_portada_evento:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No se puede eliminar la imagen de portada del evento."
        )

    es_administrador = x_user_role == "1"
    es_dueño_de_la_imagen = imagen.id_usuario == id_usuario

    if not es_administrador and not es_dueño_de_la_imagen:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para eliminar esta imagen."
        )

    url_minio = crud_imagen.eliminar_registro_imagen(db, id_imagen)
    if url_minio:
        eliminar_imagen_minio(url_minio)

    return {"mensaje": "Imagen eliminada permanentemente.", "id_imagen": id_imagen}
# ==========================================
# ENDPOINT ADMIN: Descartar reporte
# ==========================================
@router.put("/imagenes/{id_imagen}/descartar-reporte", status_code=status.HTTP_200_OK)
def descartar_reporte_endpoint(
    id_imagen: int,
    db: Session = Depends(get_db),
    id_usuario: int = Depends(obtener_id_usuario_gateway),
    rol_validado: int = Depends(verificar_rol_administrador)
):
    """
    El administrador determina que la imagen es adecuada y descarta el reporte.
    La imagen vuelve a estado normal (reportada = false).
    """
    imagen = crud_imagen.obtener_imagen_por_id(db, id_imagen)
    if not imagen:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La imagen no existe.")

    if not imagen.reportada:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La imagen no tiene un reporte activo.")

    crud_imagen.descartar_reporte_imagen(db, id_imagen)

    return {"mensaje": "Reporte descartado. La imagen ya no está marcada como reportada.", "id_imagen": id_imagen}