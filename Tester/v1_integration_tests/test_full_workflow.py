import pytest
import requests
import os

BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000/api")

@pytest.fixture(scope="module")
def admin_token():
    # Login de prueba para obtener un token de administrador
    # (Asumiendo que existe un admin por defecto)
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "admin@unl.edu.ec",
        "password": "adminpassword"
    })
    
    if response.status_code == 200:
        return response.json().get("access_token")
    return None

def test_flujo_completo_crear_evento(admin_token):
    if not admin_token:
        pytest.skip("No se pudo obtener el token de administrador para la prueba de integración")
        
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # 1. Crear un evento
    evento_data = {
        "titulo": "Seminario de Cloud Computing",
        "descripcion": "Integración de microservicios",
        "fecha": "2026-10-15T10:00:00Z"
    }
    
    res_crear = requests.post(f"{BASE_URL}/eventos/", json=evento_data, headers=headers)
    assert res_crear.status_code in [200, 201]
    
    evento_id = res_crear.json().get("id")
    assert evento_id is not None
    
    # 2. Consultar el evento creado
    res_get = requests.get(f"{BASE_URL}/eventos/{evento_id}")
    assert res_get.status_code == 200
    assert res_get.json()["titulo"] == "Seminario de Cloud Computing"
    
    # 3. Eliminar el evento para limpiar la base
    # res_del = requests.delete(f"{BASE_URL}/eventos/{evento_id}", headers=headers)
    # assert res_del.status_code == 200
