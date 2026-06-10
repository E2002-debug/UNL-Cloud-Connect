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
| **Frontend Web**          | React + Vite + Nginx   | `80`            | `80`                |

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

### 🌐 Frontend Web (Interfaz Gráfica)
* **Entorno Dockerizado (Nginx):** http://localhost (Puerto 80 por defecto)
* **Desarrollo Local (Vite sin Docker):** http://localhost:5173

### 📡 Backend (FastAPI)

* **Documentación Interactiva GEstion Usuraios(Swagger):** http://localhost:8000/api/auth/docs  *(Aquí podrás probar los endpoints de Login y Registro).*
* **Documentación Interactiva CLima (Swagger):** http://localhost:8000/api/clima/docs *(Aquí podrás probar los endpoints de Clima).*
* **Documentación Interactiva Eventos(Swagger):** http://localhost:8000/api/eventos/docs *(Aquí podrás probar los endpoints de Eventos).*

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

**Conexión base de datos (Eventos):**
* **Host:** `localhost`
* **Puerto:** `5433`
* **Base de Datos:** `db_eventos`
* **Usuario:** `postgres_admin`
* **Contraseña:** `postgres123456`
---

## 🛑 Detener los Servicios
Para apagar el entorno de contenedores de forma segura y liberar la memoria RAM de tu máquina, ejecuta:

```docker compose down```

Si deseas apagar los servicios eliminando también los datos de los volúmenes creados (limpieza total de la base de datos), usa:

```docker compose down -v```

---
---
---

# 🌐 Frontend Web | UNL Cloud Connect

Este directorio contiene la interfaz de usuario del sistema **UNL Cloud Connect**, construida con **React, Vite y TailwindCSS**. 

Este documento establece la guía estandarizada para configurar y levantar el entorno de desarrollo local sin conflictos de dependencias.

---

## ⚠️ Requisito Crítico: Node.js v20+

El proyecto utiliza dependencias modernas de compilación (como `@tailwindcss/oxide`) que requieren **estrictamente Node.js versión 20 o superior**. Si se intentan instalar las dependencias con una versión anterior (como la v18), el motor de NPM generará advertencias (`EBADENGINE`) y Vite colapsará al intentar arrancar.

### Configuración del Gestor de Versiones (NVM)
Para entornos de desarrollo Linux/Ubuntu, se exige utilizar **NVM (Node Version Manager)** para garantizar la paridad del motor de ejecución en todo el equipo:

1. **Descarga e instala NVM** (si no lo tienes):
```curl -o- [https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh](https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh)```

2. **Carga NVM en tu sesión actual**  (ejecuta estas líneas o reinicia tu terminal):

    ```export NVM_DIR="$HOME/.nvm"```<br>
     ``` [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"```<br>
    ``` [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"```

3.  **Instala y activa Node 20:**

    ```nvm install 20```<br>
     ```nvm use 20```

---

  # 🚀 Guía de Despliegue Local

    Una vez que hayas verificado que estás operando bajo Node 20, sigue estos pasos secuenciales:
1. **Limpieza del Entorno (Crucial tras clonar)**

    Para evitar archivos residuales corruptos por versiones previas de Node, limpia la caché del directorio ejecutando:<br>
```rm -rf node_modules package-lock.json```

2. **Instalación de Dependencias**

    Descarga e instala todos los paquetes del ecosistema de React:<br>
```npm install```

3. **Ejecución del Servidor**

    Levanta el servidor de desarrollo de Vite (con Hot Module Replacement):<br>
```npm run dev```

El entorno gráfico estará disponible inmediatamente en http://localhost:5173 (o el puerto dinámico que asigne la terminal).


### 💻 Desarrollado por el equipo de Procesos de Software-Computacion en la Nube - 6to 'A' - Computación UNL.