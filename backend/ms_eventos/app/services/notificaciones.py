import asyncio
import httpx
from app.models.evento import Evento

async def enviar_alerta_evento(evento: Evento, auth_token: str = None, accion: str = "creado"):
    """
    Paso 5.2: Lógica de envío asíncrona.
    Envía petición al ms_notificaciones para distribuir la notificación.
    """
    payload = {
        "nombre_evento": evento.nombre,
        "accion": accion,
        "admin_token": None,
        "usuarios_tokens": [] # ms_notificaciones will fetch them
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    print("\n" + "="*55)
    print(f"[BACKGROUND TASK] 🚀 Enviando petición a ms_notificaciones...")
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(
                "http://ms-notificaciones:8000/eventos/alerta",
                json=payload,
                headers=headers,
                timeout=10.0
            )
            print(f"Resultado: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"Error comunicando con ms_notificaciones: {e}")
    print("="*55 + "\n")