import pytest
import requests

# De AGENTS.md: ms_eventos port 8002 is exposed on the host — bypasses Kong entirely (security finding V-05).
# ms_eventos has no JWT validation — trusts Kong-injected x-user-id / x-user-role headers blindly.

DIRECT_EVENTOS_URL = "http://localhost:8002/api/eventos"
KONG_EVENTOS_URL = "http://localhost:8000/api/eventos"

def test_rbac_bypass_vulnerability():
    """
    Prueba que simula la vulnerabilidad de acceso directo al microservicio
    inyectando cabeceras falsas, demostrando que confía ciegamente en ellas.
    """
    fake_headers = {
        "x-user-id": "999",
        "x-user-role": "1" # 1 = SuperAdmin
    }
    
    # Intentar crear un evento directamente al puerto 8002 (saltando Kong)
    payload = {
        "titulo": "Evento Creado por Hacker",
        "descripcion": "Bypass de RBAC exitoso",
        "fecha": "2026-12-31"
    }
    
    response = requests.post(f"{DIRECT_EVENTOS_URL}/", json=payload, headers=fake_headers)
    
    # Si la vulnerabilidad existe, el microservicio aceptará la petición (Status 200 o 201)
    # En un sistema seguro debería ser rechazado (401 o 403)
    assert response.status_code in [200, 201], "La vulnerabilidad fue parcheada o el servicio no está en el 8002"

def test_kong_rbac_protection():
    """
    A través de Kong, enviar las cabeceras directamente debería ser bloqueado
    o reescrito por el plugin de validación de JWT.
    """
    fake_headers = {
        "x-user-id": "999",
        "x-user-role": "1"
    }
    
    # Sin un Authorization header con JWT válido, Kong debería rechazar
    response = requests.post(f"{KONG_EVENTOS_URL}/", json={"titulo": "Test"}, headers=fake_headers)
    assert response.status_code in [401, 403], "Kong no está validando el JWT correctamente"
