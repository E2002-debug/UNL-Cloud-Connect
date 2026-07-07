# Autor: Miguel Luna
# Fecha: 07/07/2026
# Version: 1.0
# Historial:
# 07/07/2026 v1.0 - Miguel Luna: Creación de funciones asíncronas para envío de Push a Expo y enrutamiento diferencial de notificaciones (Admin vs Usuarios).

from .schemas import PushRequest, EventoNotificacionRequest
import httpx
import logging
import asyncio

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

async def procesar_notificacion_evento(req: EventoNotificacionRequest):
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
    tareas_push = []
    for token in req.usuarios_tokens:
        if token:  # Asegurarnos que el token no esté vacío
            user_push = PushRequest(
                expo_push_token=token,
                titulo=f"Evento {req.accion.capitalize()}",
                mensaje=f"Noticia: Se ha {req.accion} el evento '{req.nombre_evento}'"
            )
            # Enviar todas las peticiones push en paralelo para que sea más rápido
            tareas_push.append(enviar_push_expo(user_push))
            
    if tareas_push:
        respuestas = await asyncio.gather(*tareas_push)
        for i, token in enumerate(req.usuarios_tokens):
            resultados["usuarios"].append({"token": token, "estado": "ok" if respuestas[i] else "error"})
            
    return resultados
