# Etapa 1: Compilar la aplicación React con Node.js
FROM node:20-alpine AS build

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json ./
RUN npm ci

# Copiar el resto del código fuente
COPY . .

# Variables de entorno para la compilación
# Nginx redirige /api al API Gateway internamente
ARG VITE_API_BASE=/api
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_WEATHER_API_KEY
ENV VITE_API_BASE=${VITE_API_BASE}
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}
ENV VITE_WEATHER_API_KEY=${VITE_WEATHER_API_KEY}

# Compilar para producción
RUN npm run build

# Etapa 2: Servir con Nginx
FROM nginx:alpine

# Copiar la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos compilados de React
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
