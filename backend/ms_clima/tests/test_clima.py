from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_listar_clima():
    response = client.get("/clima/")
    # As it might be empty or not, we just check status
    assert response.status_code in [200, 404]

def test_listar_sensores():
    response = client.get("/sensores/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
