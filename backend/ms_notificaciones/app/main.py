from fastapi import FastAPI
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="UNL-Cloud-Connect - MS Notificaciones",
    version="1.0.0",
    root_path="/api/notificaciones"
)

@app.get("/")
async def root():
    return {"message": "Microservicio de Notificaciones en linea"}

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ms_notificaciones"}
