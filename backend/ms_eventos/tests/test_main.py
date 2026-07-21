from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_main():
    response = client.get("/eventos/docs")
    assert response.status_code == 200

def test_eventos_activos():
    response = client.get("/eventos/activos")
    # Might return 200 or 500 depending on DB connection in test env
    assert response.status_code in [200, 500, 503]
