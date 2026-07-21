import pytest
import requests

def test_smoke_backend_services():
    """Prueba de humo para verificar que todos los servicios básicos responden."""
    
    # Auth Service
    res_auth = requests.get("http://localhost:8000/api/auth/docs", allow_redirects=True)
    assert res_auth.status_code in [200, 404] # Asumiendo que la ruta existe o está oculta, pero el servicio responde
    
    # Clima Service
    res_clima = requests.get("http://localhost:8000/api/clima/actual")
    assert res_clima.status_code in [200, 401, 403]
    
    # Eventos Service
    res_eventos = requests.get("http://localhost:8000/api/eventos/")
    assert res_eventos.status_code in [200, 401, 403]

def test_smoke_frontend_web():
    """Verifica que el servidor frontend web esté levantado."""
    try:
        res = requests.get("http://localhost:5173/")
        assert res.status_code == 200
    except requests.exceptions.ConnectionError:
        pytest.fail("El Frontend Web no está corriendo en localhost:5173")
