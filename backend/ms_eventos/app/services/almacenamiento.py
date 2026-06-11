import uuid
import os
from minio import Minio
from minio.error import S3Error
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

# Inicializamos el cliente de MinIO usando las variables del docker-compose
minio_client = Minio(
    settings.MINIO_SERVER,       # Ej: "minio:9000" (nombre del servicio en Docker)
    access_key=settings.MINIO_ROOT_USER,
    secret_key=settings.MINIO_ROOT_PASSWORD,
    secure=False                 # Estamos en red interna HTTP, no HTTPS
)

def subir_imagen_minio(file: UploadFile) -> str:
    """
    Toma el archivo validado, le asigna un UUID y lo empuja al bucket de MinIO.
    Retorna la URL pública generada para ser guardada en PostgreSQL.
    """
    try:
        # 1. Reiniciar el cursor de lectura (Vital para la integración con la HU_05)
        file.file.seek(0)
        
        # 2. Generamos un nombre único (UUID + extensión original)
        extension = os.path.splitext(file.filename)[1]
        nombre_unico = f"{uuid.uuid4()}{extension}"
        
        # 3. Subimos el objeto a MinIO
        minio_client.put_object(
            bucket_name=settings.MINIO_BUCKET_NAME,  # Ej: "unl-eventos-media"
            object_name=nombre_unico,
            data=file.file,
            length=file.size,
            content_type=file.content_type
        )
        
        # 4. Construimos la URL pública (Puerto 9005 expuesto para el Frontend)
        url_publica = f"http://localhost:9005/{settings.MINIO_BUCKET_NAME}/{nombre_unico}"
        
        return url_publica

    except S3Error as e:
        print(f"[MinIO ERROR] Fallo en el almacenamiento de objetos: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="El servicio de almacenamiento de imagenes no está disponible actualmente."
        )
    except Exception as e:
        print(f"[SISTEMA ERROR] Fallo interno al procesar el archivo: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error inesperado al subir la imagen."
        )