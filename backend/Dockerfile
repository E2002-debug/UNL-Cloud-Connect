# Autor: David Guamán
# Fecha: 21/05/2026
# Version: 0.1
# Historial:
# 21/05/2026 v0.1 - David Guamán: Creación del Dockerfile para el contenedor del backend, optimizando la caché de dependencias y variables de entorno.

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

# Copiar el resto del código del backend al contenedor
COPY . /app

# Expone el puerto en el que corre FastAPI
EXPOSE 8000