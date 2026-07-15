from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_listar_eventos_activos():
    response = client.get("/eventos/activos")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_verificar_seguridad_post_evento():
    # Sin JWT debería fallar
    response = client.post("/eventos/", json={"nombre": "Test", "descripcion": "Test desc", "fecha_inicio": "2026-07-20T10:00:00Z", "fecha_fin": "2026-07-20T12:00:00Z", "id_ubicacion": 1})
    assert response.status_code == 403 # HTTPBearer retorna 403 si no hay credenciales (o 401 dependiendo)
    # Fastapi HTTPBearer usually returns 403 Not authenticated or similar
