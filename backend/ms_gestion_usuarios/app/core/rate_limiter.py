# app/core/rate_limiter.py
# Rate limiting en memoria para proteger endpoints sensibles contra fuerza bruta.
# Estrategia: ventana deslizante por IP.
# En producción, reemplazar por Redis para persistencia entre réplicas.

import time
from collections import defaultdict, deque
from threading import Lock
from fastapi import HTTPException, Request, status


class RateLimiter:
    """
    Limita el número de peticiones por IP en una ventana de tiempo deslizante.
    
    Args:
        max_requests: Máximo de peticiones permitidas en la ventana.
        window_seconds: Tamaño de la ventana de tiempo en segundos.
    """

    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        # {ip: deque de timestamps}
        self._registros: dict[str, deque] = defaultdict(deque)
        self._lock = Lock()

    def _obtener_ip(self, request: Request) -> str:
        """Extrae la IP real considerando proxies inversos (X-Forwarded-For)."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def verificar(self, request: Request) -> None:
        """
        Verifica si la IP ha excedido el límite. 
        Lanza HTTP 429 si se superó la cuota.
        """
        ip = self._obtener_ip(request)
        ahora = time.time()
        ventana_inicio = ahora - self.window_seconds

        with self._lock:
            cola = self._registros[ip]

            # Limpiar registros fuera de la ventana
            while cola and cola[0] < ventana_inicio:
                cola.popleft()

            if len(cola) >= self.max_requests:
                tiempo_espera = int(self.window_seconds - (ahora - cola[0]))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Demasiados intentos. Por favor espera {tiempo_espera} segundos antes de intentar nuevamente.",
                    headers={"Retry-After": str(tiempo_espera)},
                )

            cola.append(ahora)


# ─── Instancias globales para cada endpoint sensible ───────────────────────────

# Login: máximo 5 intentos por minuto por IP
limiter_login = RateLimiter(max_requests=5, window_seconds=60)

# Registro: máximo 3 registros por 10 minutos por IP
limiter_registro = RateLimiter(max_requests=3, window_seconds=600)

# Recuperación de contraseña: máximo 3 solicitudes por 15 minutos por IP
limiter_recuperacion = RateLimiter(max_requests=3, window_seconds=900)
