# app/core/used_tokens.py
# V-N3 Fix: Registro de tokens de recuperación ya utilizados.
# Previene que el mismo enlace de recuperación se use más de una vez.
# En producción, usar Redis para persistencia entre reinicios de contenedor.

from threading import Lock
import time

_used_reset_tokens: dict[str, float] = {}  # {token_hash: expiry_timestamp}
_lock = Lock()


def marcar_token_usado(token: str, exp: float) -> None:
    """Registra el token de recuperación como ya utilizado."""
    with _lock:
        _used_reset_tokens[token] = exp


def token_ya_usado(token: str) -> bool:
    """Verifica si el token de recuperación ya fue utilizado. Limpia expirados de paso."""
    ahora = time.time()
    with _lock:
        # Limpieza pasiva de tokens expirados
        expirados = [k for k, exp in _used_reset_tokens.items() if exp < ahora]
        for k in expirados:
            del _used_reset_tokens[k]
        return token in _used_reset_tokens
