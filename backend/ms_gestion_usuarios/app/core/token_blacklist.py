# app/core/token_blacklist.py
# Módulo de revocación de tokens JWT (Blacklist en memoria).
# En producción, reemplazar el set por Redis para persistencia entre reinicios.

from datetime import datetime, timezone
from threading import Lock
from typing import Set

# Almacén en memoria: {jti: expiry_timestamp}
_blacklist: dict[str, float] = {}
_lock = Lock()


def revocar_token(jti: str, exp: float) -> None:
    """Añade un token a la blacklist usando su identificador único (jti)."""
    with _lock:
        _blacklist[jti] = exp


def esta_revocado(jti: str) -> bool:
    """Verifica si un token fue revocado. Limpia entradas expiradas de paso."""
    ahora = datetime.now(timezone.utc).timestamp()
    with _lock:
        # Limpieza pasiva de tokens ya expirados
        expirados = [k for k, exp in _blacklist.items() if exp < ahora]
        for k in expirados:
            del _blacklist[k]
        return jti in _blacklist
