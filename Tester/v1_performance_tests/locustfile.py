from locust import HttpUser, task, between

class UNLCloudConnectUser(HttpUser):
    # Simula un tiempo de espera entre interacciones de usuario de 1 a 3 segundos
    wait_time = between(1, 3)
    
    @task(3)
    def ver_clima(self):
        """Tarea más frecuente: Ver el clima (simula alto tráfico en ms_clima)"""
        self.client.get("/api/clima/actual")
        
    @task(2)
    def listar_eventos(self):
        """Ver la agenda de eventos"""
        self.client.get("/api/eventos/")
        
    @task(1)
    def simular_login(self):
        """Tarea de carga para el ms_gestion_usuarios"""
        self.client.post("/api/auth/login", json={
            "username": "loadtest@unl.edu.ec",
            "password": "loadpassword"
        })
