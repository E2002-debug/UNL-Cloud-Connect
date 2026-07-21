from fastapi import WebSocket
from typing import Dict, List
import json
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Mapea id_usuario a una lista de conexiones WebSocket activas
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, id_usuario: int):
        await websocket.accept()
        if id_usuario not in self.active_connections:
            self.active_connections[id_usuario] = []
        self.active_connections[id_usuario].append(websocket)
        logger.info(f"Usuario {id_usuario} conectado vía WebSocket. Conexiones activas: {len(self.active_connections[id_usuario])}")

    def disconnect(self, websocket: WebSocket, id_usuario: int):
        if id_usuario in self.active_connections:
            self.active_connections[id_usuario].remove(websocket)
            if not self.active_connections[id_usuario]:
                del self.active_connections[id_usuario]
            logger.info(f"Usuario {id_usuario} desconectado. Restantes: {len(self.active_connections.get(id_usuario, []))}")

    async def send_personal_message(self, message: dict, id_usuario: int):
        if id_usuario in self.active_connections:
            for connection in self.active_connections[id_usuario]:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception as e:
                    logger.warning(f"No se pudo enviar mensaje WS al usuario {id_usuario}: {e}")

    async def broadcast(self, message: dict):
        for id_usuario, connections in self.active_connections.items():
            for connection in connections:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception as e:
                    pass

manager = ConnectionManager()
