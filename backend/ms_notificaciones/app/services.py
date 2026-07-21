# Autor: Miguel Luna
# Fecha: 07/07/2026
# Version: 1.0
# Historial:
# 07/07/2026 v1.0 - Miguel Luna: Creación de funciones asíncronas para envío de Push a Expo y enrutamiento diferencial de notificaciones (Admin vs Usuarios).

from .schemas import PushRequest, EventoNotificacionRequest
import httpx
import logging
import asyncio
from sqlalchemy.orm import Session
from .models import DispositivoUsuario, NotificacionWeb, PreferenciaUsuario
from .ws_manager import manager

logger = logging.getLogger(__name__)

async def enviar_push_expo(push_req: PushRequest):
    url = "https://exp.host/--/api/v2/push/send"
    payload = {
        "to": push_req.expo_push_token,
        "title": push_req.titulo,
        "body": push_req.mensaje,
        "data": push_req.datos_extra or {}
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            logger.info(f"Push enviado al token {push_req.expo_push_token}")
            return response.json()
        except Exception as e:
            logger.error(f"Error enviando Push a Expo: {str(e)}")
            return None

async def procesar_notificacion_evento(req: EventoNotificacionRequest, db: Session = None):
    resultados = {"admin": None, "usuarios": []}
    
    # 1. Notificar al Administrador que disparó la acción
    if req.admin_token:
        admin_push = PushRequest(
            expo_push_token=req.admin_token,
            titulo="Gestión de Eventos",
            mensaje=f"Evento '{req.nombre_evento}' {req.accion} exitosamente."
        )
        resultados["admin"] = await enviar_push_expo(admin_push)
        
    # 2. Notificar a todos los usuarios/participantes móviles de la app
    usuarios_tokens = req.usuarios_tokens
    if not usuarios_tokens and db:
        dispositivos = db.query(DispositivoUsuario).filter(DispositivoUsuario.expo_push_token.isnot(None)).all()
        usuarios_tokens = [d.expo_push_token for d in dispositivos if d.expo_push_token.strip()]
        
    tareas_push = []
    tokens_procesados = []
    for token in usuarios_tokens:
        if token:  # Asegurarnos que el token no esté vacío
            if req.accion == "clima":
                titulo = "☁️ Alerta Climática"
                mensaje = req.nombre_evento
            elif req.accion == "modificado":
                titulo = "✏️ Evento Actualizado"
                mensaje = f"Se ha modificado el evento: '{req.nombre_evento}'"
            elif req.accion == "cancelado":
                titulo = "❌ Evento Cancelado"
                mensaje = f"Se ha cancelado el evento: '{req.nombre_evento}'"
            else:
                titulo = f"🎉 Nuevo Evento"
                mensaje = f"Se ha creado el evento '{req.nombre_evento}'"
                
            user_push = PushRequest(
                expo_push_token=token,
                titulo=titulo,
                mensaje=mensaje
            )
            # Enviar todas las peticiones push en paralelo para que sea más rápido
            tareas_push.append(enviar_push_expo(user_push))
            tokens_procesados.append(token)
            
    if tareas_push:
        respuestas = await asyncio.gather(*tareas_push)
        for i, token in enumerate(tokens_procesados):
            resultados["usuarios"].append({"token": token, "estado": "ok" if respuestas[i] else "error"})
            
    # --- LÓGICA DE NOTIFICACIONES WEB (TIEMPO REAL) ---
    if db:
        # Determinar el mensaje para la Web
        if req.accion == "clima":
            tipo = "CLIMA"
            titulo_web = "Alerta Climática"
            mensaje_web = req.nombre_evento
        elif req.accion == "modificado":
            tipo = "INFO"
            titulo_web = "Evento Actualizado"
            mensaje_web = f"Se ha modificado el evento: '{req.nombre_evento}'"
        elif req.accion == "cancelado":
            tipo = "ALERTA"
            titulo_web = "Evento Cancelado"
            mensaje_web = f"Se ha cancelado el evento: '{req.nombre_evento}'"
        else:
            tipo = "INFO"
            titulo_web = "Nuevo Evento"
            mensaje_web = f"Se ha creado el evento '{req.nombre_evento}'"
            
        # 1. Guardar en Base de Datos (id_usuario = 0 para broadcast a todos)
        nueva_notificacion = NotificacionWeb(
            id_usuario=0,
            titulo=titulo_web,
            mensaje=mensaje_web,
            tipo=tipo
        )
        db.add(nueva_notificacion)
        db.commit()
        db.refresh(nueva_notificacion)
        
        # 2. Emitir a todos los clientes web conectados vía WebSocket
        await manager.broadcast({
            "id_notificacion": nueva_notificacion.id_notificacion,
            "titulo": nueva_notificacion.titulo,
            "mensaje": nueva_notificacion.mensaje,
            "tipo": nueva_notificacion.tipo,
            "fecha_creacion": nueva_notificacion.fecha_creacion.isoformat()
        })
            
    return resultados
