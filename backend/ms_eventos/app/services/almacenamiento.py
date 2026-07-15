import uuid
import os
from minio import Minio
from minio.error import S3Error
from fastapi import UploadFile, HTTPException, status
import io
from PIL import Image
from app.core.config import settings
from datetime import timedelta
from app.core.config import settings

# Inicializamos el cliente de MinIO usando la URL pública para firmas de presigned URLs correctas
minio_public_host = settings.MINIO_PUBLIC_URL.replace("http://", "").replace("https://", "")
minio_client = Minio(
    minio_public_host,
    access_key=settings.MINIO_ROOT_USER,
    secret_key=settings.MINIO_ROOT_PASSWORD,
    secure=False
)

def subir_imagen_minio(file: UploadFile) -> str:
    """
    Toma el archivo validado, le asigna un UUID y lo empuja al bucket de MinIO.
    Retorna la URL pública generada para ser guardada en PostgreSQL.
    """
    try:
        # 1. Reiniciar el cursor de lectura (Vital para la integración con la HU_05)
        file.file.seek(0)
        
        # Strip EXIF data to prevent privacy leaks
        try:
            image = Image.open(file.file)
            # Remove EXIF if present
            if "exif" in image.info:
                del image.info["exif"]
            
            output = io.BytesIO()
            img_format = image.format or "JPEG"
            if img_format == "JPEG" and image.mode in ("RGBA", "P"):
                image = image.convert("RGB")
            
            image.save(output, format=img_format)
            file_size = output.tell()
            output.seek(0)
            file_data = output
        except Exception as e:
            print(f"[Pillow ERROR] Fallo al limpiar EXIF: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El archivo proporcionado no es una imagen válida o está corrupto."
            )
        
        # 2. Generamos un nombre único (UUID + extensión original)
        extension = os.path.splitext(file.filename)[1]
        nombre_unico = f"{uuid.uuid4()}{extension}"
        
        # 3. Subimos el objeto a MinIO
        minio_client.put_object(
            bucket_name=settings.MINIO_BUCKET_NAME,  # Ej: "unl-eventos-media"
            object_name=nombre_unico,
            data=file_data,
            length=file_size,
            content_type=file.content_type
        )
        
        # 4. Construimos la URL pública (Usando el host público configurado)
        url_publica = f"{settings.MINIO_PUBLIC_URL}/{settings.MINIO_BUCKET_NAME}/{nombre_unico}"
        
        return url_publica

    except S3Error as e:
        # V-C2 Fix: No exponer detalle técnico de MinIO al cliente
        print(f"[MinIO ERROR] Fallo en el almacenamiento de objetos: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="El servicio de almacenamiento no está disponible. Por favor intenta más tarde."
        )
    except Exception as e:
        # V-C2 Fix: No exponer stack trace interno al cliente
        print(f"[SISTEMA ERROR] Fallo interno al procesar el archivo: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error inesperado al subir la imagen. Por favor intenta nuevamente."
        )


def eliminar_imagen_minio(url: str) -> bool:
    """
    Elimina un objeto de MinIO a partir de su URL pública.
    Retorna True si se eliminó correctamente, False si falló.
    """
    try:
        object_name = url.split(f"{settings.MINIO_BUCKET_NAME}/")[-1]
        minio_client.remove_object(settings.MINIO_BUCKET_NAME, object_name)
        return True
    except S3Error as e:
        print(f"[MinIO ERROR] Fallo al eliminar objeto: {e}")
        return False

def generar_url_firmada(url_base: str) -> str:
    """
    V-N10 Fix: Convierte la URL base almacenada en la DB en una presigned URL
    temporal válida por 2 horas, para acceso privado.
    """
    if not url_base:
        return None
    try:
        object_name = url_base.split(f"{settings.MINIO_BUCKET_NAME}/")[-1]
        # Generar enlace temporal (expira en 2 horas)
        return minio_client.presigned_get_object(
            bucket_name=settings.MINIO_BUCKET_NAME,
            object_name=object_name,
            expires=timedelta(hours=2)
        )
    except Exception as e:
        print(f"[MinIO ERROR] Fallo al firmar URL: {e}")
        return url_base