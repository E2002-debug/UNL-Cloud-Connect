# app/core/security.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

def configurar_seguridad_app(app: FastAPI):
    """
    Configuración centralizada de CORS y políticas de seguridad del microservicio.
    Los orígenes permitidos se leen desde la variable BACKEND_CORS_ORIGINS (separados por coma).
    Si no está definida, solo se permite localhost:5173 (desarrollo local).
    """
    cors_origins_raw = os.getenv("BACKEND_CORS_ORIGINS", "http://localhost:5173")
    cors_origins = [o.strip() for o in cors_origins_raw.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "x-user-id", "x-user-role"],
    )