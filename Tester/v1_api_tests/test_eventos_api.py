import pytest
import requests
import os

BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000/api")

def test_listar_eventos_publicos():
    # Asumiendo que hay una ruta para obtener eventos
    response = requests.get(f"{BASE_URL}/eventos/")
    assert response.status_code in [200, 401]
    
    if response.status_code == 200:
        assert isinstance(response.json(), list)

def test_crear_evento_sin_auth():
    response = requests.post(f"{BASE_URL}/eventos/", json={
        "titulo": "Evento Test",
        "descripcion": "Descripción del evento de prueba"
    })
    # Debería ser rechazado porque no tiene JWT (vía Kong o el MS directamente)
    assert response.status_code in [401, 403]

def test_obtener_evento_inexistente():
    response = requests.get(f"{BASE_URL}/eventos/999999")
    assert response.status_code == 404
