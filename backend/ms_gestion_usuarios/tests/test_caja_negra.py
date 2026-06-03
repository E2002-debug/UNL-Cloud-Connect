import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from app.main import app
from app.models.usuario import Usuario
from app.core.security import obtener_hash_clave

# Inicializamos el cliente de pruebas simulando peticiones HTTP reales
client = TestClient(app)

@patch("app.routers.auth.crud_usuario.obtener_usuario_por_correo")
@patch("app.routers.auth.crud_usuario.crear_usuario")
def test_registro_exitoso_caja_negra(mock_crear_usuario, mock_obtener_usuario):
    """
    Test de Caja Negra: Simula una petición HTTP POST a /api/auth/registro.
    Verifica que el endpoint acepte los datos de entrada correctos y 
    devuelva un HTTP 201 Created. No le importa la lógica interna, 
    solo la respuesta hacia afuera.
    """
    # Configuramos el Mock para que simule que el usuario NO existe
    mock_obtener_usuario.return_value = None
    
    # Configuramos el Mock para simular lo que la base de datos retornaría al crear
    mock_crear_usuario.return_value = Usuario(
        id_usuario=1,
        nombre="Juan",
        apellido="Perez",
        correo="juan.perez@unl.edu.ec",
        id_rol=2
    )

    payload = {
        "nombre": "Juan",
        "apellido": "Perez",
        "correo": "juan.perez@unl.edu.ec",
        "id_rol": 2,
        "clave": "MiClaveSuperSegura"
    }

    # Enviamos la petición POST
    response = client.post("/auth/registro", json=payload)
    
    # Verificaciones de Caja Negra
    assert response.status_code == 201
    data = response.json()
    assert data["correo"] == "juan.perez@unl.edu.ec"
    assert "clave" not in data # Aseguramos que la contraseña no se filtre en la respuesta

@patch("app.routers.auth.crud_usuario.obtener_usuario_por_correo")
def test_login_fallido_caja_negra(mock_obtener_usuario):
    """
    Test de Caja Negra: Simula una petición HTTP POST a /api/auth/login con clave incorrecta.
    Verifica que el API rechace la petición con un HTTP 401 Unauthorized.
    """
    # Simulamos que el usuario SÍ existe en la base de datos
    mock_usuario = Usuario(
        id_usuario=1,
        correo="admin@unl.edu.ec",
        clave=obtener_hash_clave("PasswordReal123"), # Contraseña real guardada
        id_rol=1
    )
    mock_obtener_usuario.return_value = mock_usuario

    payload = {
        "username": "admin@unl.edu.ec",
        "password": "PasswordIncorrecto" # El atacante intenta una mala contraseña
    }

    response = client.post("/auth/login", json=payload)
    
    # Verificaciones de Caja Negra
    assert response.status_code == 401
    assert response.json()["detail"] == "Correo institucional o contraseña incorrectos."

def test_dominio_invalido_caja_negra():
    """
    Test de Caja Negra: Envía un correo que NO es de la UNL.
    El API debería rechazarlo automáticamente por validación Pydantic 
    devolviendo HTTP 422 Unprocessable Entity.
    """
    payload = {
        "nombre": "Hacker",
        "apellido": "Malo",
        "correo": "hacker@gmail.com", # Dominio prohibido
        "id_rol": 2,
        "clave": "12345678"
    }

    response = client.post("/auth/registro", json=payload)
    
    # Verificación de Caja Negra
    assert response.status_code == 422
    assert "El correo debe pertenecer al dominio institucional" in response.text
