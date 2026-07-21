import pytest
import requests
import os

BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000/api")

def test_get_clima_actual():
    response = requests.get(f"{BASE_URL}/clima/actual")
    # Even if unauthenticated, depends on route auth. Assuming public or 401
    assert response.status_code in [200, 401, 403]
    if response.status_code == 200:
        data = response.json()
        assert "temperatura" in data
        assert "humedad" in data

def test_get_pronostico():
    response = requests.get(f"{BASE_URL}/clima/pronostico")
    assert response.status_code in [200, 401, 403]

def test_get_historial_clima():
    response = requests.get(f"{BASE_URL}/clima/historial")
    assert response.status_code in [200, 401, 403]
