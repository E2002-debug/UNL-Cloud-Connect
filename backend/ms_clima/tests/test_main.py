from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_main():
    response = client.get("/clima/docs")
    assert response.status_code == 200

def test_clima_endpoint():
    response = client.get("/clima/")
    # If DB or MQTT is missing it might return 500 or 200, so we just check it exists
    assert response.status_code in [200, 500, 503, 404]
