<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# UNL Cloud Connect - Frontend Mobile

Esta es la aplicación móvil nativa construida con **React Native (Expo)** para la Plataforma de Sensores de la UNL. Está integrada con los microservicios del backend a través de **Kong API Gateway** y soporta inicio de sesión clásico, registro de usuarios, registro híbrido, recuperación de contraseña e inicio de sesión dual con Google.

## Dependencias y Requisitos de Software

En proyectos de JavaScript y React Native, **no se utiliza un archivo `requirements.txt`** (como en Python). En su lugar, todas las librerías necesarias están registradas en el archivo [package.json](package.json).

Al ejecutar `npm install`, el gestor de paquetes de Node.js descarga e instala automáticamente todas las dependencias de software listadas en la versión correcta y compatible.

---

## Cómo Ejecutar la Aplicación

Existen dos maneras de ejecutar y probar el proyecto móvil según lo que prefieras:

### Método A: Usando solo **Expo Go** (Sin Android Studio ni Emulador)
Ideal si tu compañero no quiere instalar Android Studio y prefiere probar la aplicación directamente en su teléfono real a través de Wi-Fi de forma muy ligera y rápida.

*   **Compatibilidad con Google Sign-In:** La app de *Expo Go* no soporta la librería nativa de Google Play Services de fábrica. Para evitar que la app se caiga, el código del Login detecta si corre en Expo Go y **habilitará un modo de simulación de Google Sign-in** (ingresando automáticamente con la cuenta de Miguel Luna) al presionar el botón de Google.

**Pasos para ejecutar:**
1.  Instala la aplicación gratuita **Expo Go** en tu celular desde Google Play Store o Apple App Store.
2.  En la terminal de tu computadora, entra a la carpeta `frontend-mobile` y ejecuta:
    ```bash
    npm start
    ```
3.  Asegúrate de que la PC y tu celular estén en la **misma red Wi-Fi**.
4.  Escanea el código QR gigante que aparecerá en tu terminal desde la aplicación Expo Go.


