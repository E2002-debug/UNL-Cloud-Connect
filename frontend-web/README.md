
# Frontend Web — UNL-Cloud-Connect

Resumen: Interfaz responsive ultra-minimalista para autenticación (Login, Registro, Registro híbrido con Google, Recuperación y cambio de contraseña). Diseño: fondo limpio (#FFFFFF / #F9FAFB), texto pizarra oscuro (#0F172A), botones principales azul brillante (#2563EB), tarjetas flotantes con radio 12px y sombras sutiles.

Estructura principal:
- `src/components/` — `Button`, `Input`, `Card`, `AuthLayout`
- `src/pages/` — `Login`, `Register`, `GoogleHybrid`, `Recover`, `ResetPassword`
- `src/services/api.js` — funciones para consumir los endpoints del backend

Requisitos:
- Node.js 18+ y npm
- Tailwind CSS (dev dependency)
- Backend FastAPI corriendo y accesible (configurar `VITE_API_BASE` si aplica)

Instalación y ejecución rápida:

```bash
cd frontend-web
npm install
# Instalar Tailwind si no está configurado
npm install -D tailwindcss postcss autoprefixer
# Ejecutar en desarrollo
npm run dev
```

Variables de entorno (opcional):
- `VITE_API_BASE` — URL base del backend (ej: `http://localhost:8000`). Si no está definida, se usa `/api`.

Notas de integración:
- Los endpoints utilizados están definidos en `src/services/api.js`:
	- `POST /auth/login`
	- `POST /auth/login-google`
	- `POST /auth/registro`
	- `POST /auth/google-register`
	- `POST /auth/registro-hibrido`
	- `POST /auth/recover`
	- `POST /auth/reset-password`
- `AuthLayout` aplica layout de dos columnas en escritorio y columna única en móvil.

Estilo y tokens:
- Archivo de configuración: `tailwind.config.cjs` — colores: `background`, `slate.900`, `primary`.
- Variables CSS en `src/index.css`.

Siguientes pasos recomendados:
- Conectar con el flujo real de OAuth de Google (`@react-oauth/google`) y manejar tokens en `loginGoogle`.
- Añadir validaciones y feedback de formulario (p. ej. `react-hook-form` + `yup`).
