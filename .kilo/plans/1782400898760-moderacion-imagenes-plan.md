# Plan: Sistema de Reportes y Moderación de Imágenes

## Objetivo
Implementar funcionalidad para que usuarios reporten imágenes inapropiadas y administradores moderen contenido.

## Cambios Backend (ms_eventos)

### 1. Modelo ImagenEvento (`app/models/imagen.py`)
- Agregar import: `Boolean, Text`
- Agregar campos a `ImagenEvento`:
  - `reportada: Mapped[bool]` (Boolean, nullable=False, default=False)
  - `motivo_reporte: Mapped[str | None]` (Text, nullable=True, default=None)

### 2. Migración DB (`app/database/init_db.py`)
- Agregar migraciones RAW SQL:
  - `ALTER TABLE imagen_evento ADD COLUMN IF NOT EXISTS reportada BOOLEAN NOT NULL DEFAULT FALSE;`
  - `ALTER TABLE imagen_evento ADD COLUMN IF NOT EXISTS motivo_reporte TEXT;`

### 3. Schemas (`app/schemas/imagen.py`)
- Nuevas clases Pydantic:
  - `ReportarImagenRequest` (motivo: str)
  - `ImagenReportadaResponse` (id_imagen, url, id_evento, id_usuario, reportada, motivo_reporte, evento_nombre)
  - `ImagenEventoResponse` (con campos reportada/motivo_reporte)

### 4. Servicio MinIO (`app/services/almacenamiento.py`)
- Nueva función: `eliminar_imagen_minio(nombre_objeto: str) -> None`

### 5. CRUD (`app/crud/crud_imagen.py`)
- Nuevas funciones:
  - `reportar_imagen(db, id_imagen, motivo) -> ImagenEvento | None`
  - `descartar_reporte_imagen(db, id_imagen) -> ImagenEvento | None`
  - `obtener_imagenes_reportadas(db) -> List[Tuple[ImagenEvento, str | None]]`
  - `eliminar_imagen(db, id_imagen) -> ImagenEvento | None`

### 6. Router (`app/routers/eventos.py`)
- Actualizar `listar_imagenes_evento`: incluir `reportada` y `motivo_reporte` en respuesta
- Nuevos endpoints:
  - `POST /api/eventos/imagenes/{id_imagen}/reportar` (auth required)
  - `GET /api/eventos/imagenes/reportadas/` (admin only)
  - `POST /api/eventos/imagenes/{id_imagen}/descartar-reporte` (admin only)
  - `DELETE /api/eventos/imagenes/{id_imagen}` (admin only)

## Cambios Frontend

### 1. Servicio (`src/components/dashboard/events/eventService.js`)
- Nuevas funciones:
  - `reportarImagen(id_imagen, motivo)`
  - `getImagenesReportadas()`
  - `eliminarImagen(id_imagen)`
  - `descartarReporteImagen(id_imagen)`

### 2. EventoPage.jsx
- Agregar icono `IconFlag` (bandera)
- Agregar función `handleReportarImagen`
- Agregar botón en cada post del feed

### 3. ModeracionImagenes.jsx (NUEVO)
- Componente con tabla de imágenes reportadas
- Columnas: miniatura, evento, motivo, fecha, acciones
- Botones: "Descartar" y "Eliminar"

### 4. Dashboard.jsx
- Importar `ModeracionImagenes`
- Agregar icono `IconFlag`
- Agregar menú "Moderación" para rol 1 (admin) y rol 3 (superadmin)
- Renderizar `<ModeracionImagenes />` cuando activeTab === 'Moderacion'

## Notas
- Los endpoints usan la misma arquitectura Zero Trust (headers inyectados por Kong)
- La eliminación física borra de PostgreSQL y MinIO
- Requiere rebuild de contenedor ms_eventos para aplicar migraciones