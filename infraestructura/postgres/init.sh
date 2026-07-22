#!/bin/bash
# Autor: David Guamán
# Script para crear múltiples bases de datos lógicas en un solo contenedor

set -e

# Ejecutamos comandos SQL utilizando el usuario por defecto de Postgres
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL

    -- 1. Base de datos exclusiva para el Microservicio de Identidad
    CREATE DATABASE db_usuarios;
    
    -- 2. Base de datos exclusiva para el Microservicio de Telemetría e IoT
    CREATE DATABASE db_clima;

    -- 3. Base de datos exclusiva para el Microservicio de Eventos
    CREATE DATABASE db_eventos;

    -- 4. Base de datos exclusiva para el Microservicio de Notificaciones
    CREATE DATABASE db_notificaciones;

EOSQL

echo "[POSTGRES-INIT] Bases de datos 'db_usuarios', 'db_clima', 'db_eventos' y 'db_notificaciones' creadas exitosamente."