# UNL-Cloud-Connect
Ecosistema IoT distribuido para gestión de eventos y monitoreo climático en la UNL (Campus La Argelia).

---

## 📋 Requisitos Previos

Antes de levantar el entorno, asegúrate de tener instalado en tu sistema:
* **Docker** (v20.10 o superior)
* **Docker Compose** (v2.0 o superior)
* **Git**

---

## 🛠️ Stack Tecnológico de la Infraestructura

A través de Docker, el sistema levanta automáticamente los siguientes servicios de forma aislada:

| Servicio                  | Tecnología             | Puerto Interno  | Puerto Host (Tu PC) |
| :---                      | :---                   | :---            | :---                |
| **API Gateway (Puerta Principal)**   | Kong (Modo DB-less)       | `8000`          | `8000`            |
| **MS_Gestion_Usuarios**   | FastAPI (Python)       | `8000`          | `oculto`            |
| **MS_CLima**              | FastAPI (Python)       | `8000`          | `oculto`            |
| **Base de Datos**         | PostgreSQL 15          | `5432`          | `5433`              |
| **Broker IoT**            | Eclipse Mosquitto      | `1883`          | `1883`              |
| **Storage**               | MinIO (Object Storage) | `9000` / `9001` | `9000` / `9002`     |

---

## 🚀 Instrucciones para Levantar el Entorno

Sigue estos pasos en orden para clonar, configurar e iniciar el proyecto localmente.

### 1. Clonar el repositorio y acceder a la rama correcta

```git clone <URL_DEL_REPOSITORIO>```
```cd unl-cloud-connect```

# Asegúrate de trabajar sobre la rama de desarrollo compartida
```git checkout develop```

### 2. Construir y levantar los contenedores por primera vez
Ejecuta el siguiente comando en la raíz del proyecto (donde se encuentra el archivo `docker-compose.yml`):

```docker compose up --build```

> 💡 **Nota:** La primera vez tardará unos minutos mientras descarga las imágenes base y compila el entorno del backend. Para las siguientes ocasiones, puedes iniciar el entorno simplemente con `docker compose up` (sin el `--build`).

Si deseas que corra en segundo plano (liberando tu terminal), añade la bandera `-d`:

```docker compose up -d```

### 3. Verificar el estado de los servicios
Para comprobar que todos los contenedores estén corriendo de forma óptima:

```docker compose ps```

## 🔑 Credenciales y Accesos Locales
Una vez que los contenedores estén en ejecución (Up), puedes acceder a las herramientas mediante las siguientes direcciones:

### 📡 Backend (FastAPI)

* **Documentación Interactiva GEstion Usuraios(Swagger):** http://localhost:8000/api/auth/docs *(Aquí podrás probar los endpoints de Login y Registro).*
* **Documentación Interactiva CLima (Swagger):** http://localhost:8000/api/clima/docs *(Aquí podrás probar los endpoints de Clima).*
### 💾 Almacenamiento de Imágenes (MinIO)
* **Consola de Administración Web:** http://localhost:9002
* **Usuario:** `minio_admin`
* **Contraseña:** `minio123456`

### 🗄️ Base de Datos (PostgreSQL)
Si deseas conectarte a la base de datos usando un cliente externo (como DBeaver, PGAdmin o la extensión de VS Code), usa estos parámetros:

**Conexión base de datos (Usuarios):**
* **Host:** `localhost`
* **Puerto:** `5433`
* **Base de Datos:** `db_usuarios`
* **Usuario:** `postgres_admin`
* **Contraseña:** `postgres123456`

**Conexión base de datos (Clima):**
* **Host:** `localhost`
* **Puerto:** `5433`
* **Base de Datos:** `db_clima`
* **Usuario:** `postgres_admin`
* **Contraseña:** `postgres123456`
---

## 🛑 Detener los Servicios
Para apagar el entorno de contenedores de forma segura y liberar la memoria RAM de tu máquina, ejecuta:

```docker compose down```

Si deseas apagar los servicios eliminando también los datos de los volúmenes creados (limpieza total de la base de datos), usa:

```docker compose down -v```

### 💻 Desarrollado por el equipo de Procesos de Software-Computacion en la Nube - 6to 'A' - Computación UNL.