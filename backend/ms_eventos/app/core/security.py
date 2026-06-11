# app/core/security.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

def configurar_seguridad_app(app: FastAPI):
    """
    Configuración centralizada de CORS y políticas de seguridad del microservicio.
    Aunque Kong Gateway maneja los CORS globales en producción, 
    esta configuración permite el desarrollo y las pruebas locales directas.
    """
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"], # En producción estricta, esto se restringe a la IP de Kong
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )