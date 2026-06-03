# Autor: David Guamán
# Fecha: 29/05/2026
# Version: 0.2
# Historial:
# 21/05/2026 v0.1 - David Guamán: Creación del Dockerfile para el contenedor del backend monolítico.
# 29/05/2026 v0.2 - David Guamán: Adaptación del Dockerfile para arquitectura de microservicios, manteniendo Python 3.12.

FROM python:3.12-slim

# Evita que Python escriba archivos .pyc en el disco
ENV PYTHONDONTWRITEBYTECODE 1

# Evita que Python guarde en el búfer las salidas de la terminal
ENV PYTHONUNBUFFERED 1

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar e instalar dependencias primero (aprovecha la caché de Docker)
COPY ./requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt

# Copiar el código del microservicio al contenedor
COPY ./app /app/app

# Expone el puerto en el que corre FastAPI
EXPOSE 8000

# Comando para arrancar el servidor
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]