import pytest
import requests
import os

BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000/api")

def test_login_invalid_credentials():
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "noexiste@unl.edu.ec",
        "password": "wrongpassword"
    })
    assert response.status_code in [401, 404]

def test_login_missing_fields():
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "solo_usuario@unl.edu.ec"
    })
    assert response.status_code == 422 # Pydantic validation error

def test_google_login_invalid_token():
    response = requests.post(f"{BASE_URL}/auth/login-google", json={
        "google_token": "invalid_fake_token"
    })
    assert response.status_code in [400, 401, 403]
