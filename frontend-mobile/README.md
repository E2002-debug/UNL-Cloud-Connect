# Frontend Mobile — UNL-Cloud-Connect

Resumen: Implementación móvil (Expo/React Native) con diseño coherente al frontend web: ultra-minimalista, tarjetas con radio 12px y sombras sutiles, tipografía limpia y colores establecidos.

Estructura principal:
- `App.js` — navegación principal (React Navigation)
- `src/screens/` — `LoginScreen`, `RegisterScreen`, `GoogleHybridScreen`, `RecoverScreen`, `ResetPasswordScreen`
- `src/components/` — `Button`, `Input`
- `src/services/api.js` — cliente fetch simple para consumir el backend

Requisitos sugeridos:
- Node.js 18+, npm
- Expo CLI (recomendado) o React Native CLI

Instalación y ejecución rápida (Expo):

```bash
cd frontend-mobile
npm install
# Instalar expo si no lo tienes
npm install -g expo-cli
npx expo start
```

Notas de integración:
- Ajusta `BASE` en `src/services/api.js` al host donde corre el FastAPI (ej: `http://10.0.2.2:8000` para emulador Android o `http://localhost:8000` para tunelización).
- Los endpoints usados son los mismos que en Web (`/auth/login`, `/auth/registro`, etc.).
- Para integrar OAuth de Google en móvil, usar `expo-auth-session` o la librería recomendada por Expo y enviar el token al endpoint `POST /auth/login-google`.

Siguientes pasos recomendados:
- Añadir validaciones de formulario y feedback visual.
- Integrar NativeWind para estilo tipo Tailwind si se desea homogeneizar clases.
