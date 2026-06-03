# Autor: David Guamán
# Fecha: 03/06/2026
# Version: 1.0
# Historial:
# 03/06/2026 v1.0 - David Guamán: Creación de middleware para protección contra ataques de fuerza bruta y limitación de peticiones por IP (Rate Limiting y Bloqueo).

from fastapi import Request, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import time
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

class IPRateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware que bloquea direcciones IP si realizan demasiadas peticiones en un corto período de tiempo.
    Protege contra ataques de denegación de servicio (DoS) y fuerza bruta en los endpoints de autenticación.
    """
    def __init__(self, app, max_requests: int = 50, window_seconds: int = 60, block_seconds: int = 300):
        super().__init__(app)
        self.max_requests = max_requests # Máximo de peticiones permitidas
        self.window_seconds = window_seconds # En este periodo de tiempo (ej. 60 segundos)
        self.block_seconds = block_seconds # Tiempo de castigo si excede el límite (ej. 300s = 5 min)
        
        # Diccionario en memoria para rastrear IPs: { "192.168.1.5": [timestamp1, timestamp2, ...] }
        self.request_history = defaultdict(list)
        # Diccionario para IPs bloqueadas: { "192.168.1.5": tiempo_de_desbloqueo }
        self.blocked_ips = {}

    async def dispatch(self, request: Request, call_next):
        # 1. Obtener la IP real del cliente (incluso si estamos detrás de Nginx o Kong)
        client_ip = request.headers.get("x-forwarded-for")
        if client_ip:
            client_ip = client_ip.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "unknown"

        current_time = time.time()

        # 2. Verificar si la IP ya se encuentra en la lista negra (bloqueada)
        if client_ip in self.blocked_ips:
            block_expire = self.blocked_ips[client_ip]
            if current_time < block_expire:
                # Sigue bloqueado
                tiempo_restante = int(block_expire - current_time)
                logger.warning(f"Intento de acceso desde IP bloqueada: {client_ip}. Restan {tiempo_restante}s")
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "detail": f"Actividad sospechosa detectada. Tu dirección IP ha sido bloqueada por seguridad. Intenta nuevamente en {tiempo_restante} segundos."
                    }
                )
            else:
                # El castigo terminó, remover de la lista negra
                logger.info(f"Levantando bloqueo de IP: {client_ip}")
                del self.blocked_ips[client_ip]
                # Reiniciamos su historial para darle otra oportunidad
                if client_ip in self.request_history:
                    del self.request_history[client_ip]

        # 3. Limpiar el historial de esta IP, quitando peticiones muy antiguas
        self.request_history[client_ip] = [
            t for t in self.request_history[client_ip]
            if current_time - t < self.window_seconds
        ]

        # 4. Registrar la petición actual
        self.request_history[client_ip].append(current_time)

        # 5. Evaluar si cruzó el límite de peticiones (Comportamiento de Bot/Ataque)
        if len(self.request_history[client_ip]) > self.max_requests:
            logger.error(f"BLOQUEO DE SEGURIDAD: La IP {client_ip} ha excedido {self.max_requests} peticiones en {self.window_seconds}s.")
            self.blocked_ips[client_ip] = current_time + self.block_seconds
            
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Límite de peticiones excedido. Tu dirección IP ha sido bloqueada temporalmente por comportamiento sospechoso."
                }
            )

        # 6. Si todo está en orden, procesar la petición normalmente
        response = await call_next(request)
        return response