import asyncio
from app.models.evento import Evento

async def enviar_alerta_nuevo_evento(evento: Evento):
    """
    Paso 5.2: Lógica de envío asíncrona.
    Construye el payload para Firebase Cloud Messaging (FCM).
    """
    # Simulamos el tiempo que tarda la red en comunicarse con los servidores de Google (FCM)
    await asyncio.sleep(2)
    
    # Construcción estricta del payload según la documentación de Firebase
    payload_fcm = {
        "notification": {
            "title": "🎓 Nuevo Evento en la Facultad",
            "body": f"Se ha programado: {evento.nombre}"
        },
        "data": {
            "id_evento": str(evento.id_evento),
            "fecha_inicio": evento.fecha_hora_inicio.isoformat(),
            "estado": evento.estado.value,
            "tipo": "alerta_academica"
        },
        # Asumiendo que los estudiantes con correo @unl.edu.ec están suscritos a este tópico
        "topic": "unl_comunidad" 
    }
    
    # Aquí iría el código real del SDK de Firebase (ej. messaging.send(mensaje))
    print("\n" + "="*55)
    print(f"[BACKGROUND TASK] 🚀 Notificación Push despachada")
    print(f"Payload estructurado para FCM: {payload_fcm}")
    print("="*55 + "\n")