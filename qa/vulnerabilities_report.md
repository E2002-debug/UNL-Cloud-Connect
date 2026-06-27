# Reporte de Vulnerabilidades — UNL Cloud Connect

**Fecha:** $(date +%Y-%m-%d)
**Tester:** Equipo QA
**Versión del sistema:** v0.4

---

## Resumen Ejecutivo

| Total | Críticas | Altas | Medias | Bajas | Informativas |
|---|---|---|---|---|---|
| 8 | 2 | 1 | 3 | 1 | 1 |

---

## V-01: RBAC Frontend es Client-Side Puro (Exposición de Funcionalidad)

| Campo | Valor |
|---|---|
| **ID** | V-01 |
| **Severidad** | 🔴 **ALTA** |
| **Componente** | Frontend Web — `App.jsx:16-33`, `Dashboard.jsx` |
| **CWE** | CWE-602: Client-Side Enforcement of Server-Side Security |
| **Tipo** | Exposición de funcionalidad |

### Descripción

El control de acceso en el frontend se basa exclusivamente en el valor de `localStorage.getItem('id_rol')`. Cualquier usuario con acceso a DevTools del navegador puede cambiar su `id_rol` de `"2"` a `"1"` y ver inmediatamente la interfaz de Administrador.

**Código vulnerable:**
```javascript
// App.jsx:16-18
const GuardedRoute = ({ element: Element }) => {
  const token = localStorage.getItem('access_token')
  const idRol = localStorage.getItem('id_rol')
  // ...
  if (String(idRol) !== '1' && String(idRol) !== '2') { ... }
  return <Element />
}
```

### Impacto

- Un participante puede ver el panel de "Gestión de Usuarios", "Configuración" y otras interfaces administrativas.
- Aunque las operaciones reales (PUT/DELETE) son bloqueadas por el backend, la **exposición de funcionalidad** permite:
  - Recolección de información sobre la estructura del sistema
  - Identificación de endpoints y parámetros
  - Posible explotación de vulnerabilidades futuras en el backend

### Reproducción

1. Iniciar sesión como Participante
2. Abrir DevTools → Application → Local Storage
3. Cambiar `id_rol` de `"2"` a `"1"`
4. Recargar la página

### Recomendación

- Implementar un `AuthContext` en React que centralice la verificación de roles
- NO confiar en `localStorage` para decisiones de UI de seguridad
- Consultar el backend para determinar permisos del usuario actual

---

## V-02: ms_eventos No Valida JWT — Confía Solo en Headers Kong

| Campo | Valor |
|---|---|
| **ID** | V-02 |
| **Severidad** | 🔴 **CRÍTICA** |
| **Componente** | `ms_eventos` — `eventos.py:41-51`, `docker-compose.yml:105` |
| **CWE** | CWE-306: Missing Authentication for Critical Function |
| **Tipo** | Autenticación faltante |

### Descripción

El microservicio `ms_eventos` no valida tokens JWT. En lugar de eso, confía exclusivamente en los headers `x-user-id` y `x-user-role` que Kong inyecta después de validar el JWT. Sin embargo:

1. **El puerto 8002 está expuesto** en `docker-compose.yml:105` (`"8002:8000"`)
2. **Cualquiera en la red local** puede bypassear Kong conectándose directamente a `localhost:8002`
3. **Los headers son falsificables** — no hay firma criptográfica

**Código vulnerable:**
```python
# eventos.py:41-51
def verificar_rol_administrador(x_user_role: str = Header(..., alias="x-user-role")):
    if x_user_role != "1":
        raise HTTPException(status_code=403, ...)
    return int(x_user_role)
```

### Impacto

- **CRÍTICO:** Cualquier persona con acceso al puerto 8002 puede crear, editar o eliminar eventos usando:
  ```bash
  curl -X POST http://localhost:8002/eventos/ \
    -H "x-user-id: 1" \
    -H "x-user-role: 1" \
    -d '{...}'
  ```
- No se requiere token JWT ni autenticación real

### Reproducción

```bash
curl -s -X POST "http://localhost:8002/eventos/" \
  -H "Content-Type: application/json" \
  -H "x-user-id: 999" \
  -H "x-user-role: 1" \
  -d '{"titulo":"Vulnerabilidad","descripcion":"Creado sin auth","fecha_hora":"2026-12-31T23:59:59","id_ubicacion":1}'
```

### Recomendación

- **Opción 1 (Inmediata):** Eliminar la exposición del puerto 8002 en `docker-compose.yml`
- **Opción 2 (Recomendada):** Agregar validación JWT en `ms_eventos` usando la misma `SECRET_KEY` que `ms_gestion_usuarios`
- **Opción 3 (Capa adicional):** Validar que el `x-user-id` corresponda a un usuario real en la BD antes de cualquier operación

---

## V-03: Sin Interceptor 401 en Axios (Token Expirado)

| Campo | Valor |
|---|---|
| **ID** | V-03 |
| **Severidad** | 🟡 **MEDIA** |
| **Componente** | Frontend Web — `api.js` |
| **CWE** | CWE-613: Insufficient Session Expiration |
| **Tipo** | Gestión de sesión |

### Descripción

El archivo `api.js` configura un interceptor de solicitudes para agregar el token JWT, pero **no tiene un interceptor de respuestas** para manejar errores 401:

```javascript
// api.js — SOLO hay interceptor de request, no de response
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) { config.headers.Authorization = `Bearer ${token}`; }
  return config;
});
// NO HAY: api.interceptors.response.use(...)
```

### Impacto

- Cuando el token expira (24h), las peticiones fallan silenciosamente con 401
- El usuario no es redirigido al login
- La aplicación muestra errores no controlados al usuario

### Recomendación

Agregar interceptor de respuesta:
```javascript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login?expired=true';
    }
    return Promise.reject(error);
  }
);
```

---

## V-04: Sin Logging de Accesos Denegados (403)

| Campo | Valor |
|---|---|
| **ID** | V-04 |
| **Severidad** | 🟡 **MEDIA** |
| **Componente** | `ms_gestion_usuarios` — `deps.py`, `ms_eventos` — `eventos.py` |
| **CWE** | CWE-778: Insufficient Logging |
| **Tipo** | Auditoría |

### Descripción

Cuando se rechaza una petición por RBAC (HTTP 403), no se registra el evento en ningún log. Es imposible auditar:
- Intentos de acceso no autorizado
- Patrones de ataque
- Usuarios que intentan escalar privilegios

### Impacto

- No se pueden detectar ataques en curso
- No hay evidencia forense después de un incidente
- Compliance: no se cumple con requisitos básicos de auditoría

### Recomendación

Agregar logging estructurado en:
- `deps.py`: `logger.warning(f"Acceso denegado: usuario {id} intentó acceder a {ruta}")`
- `eventos.py`: `logger.warning(f"Rol denegado: {x_user_role} intentó operación admin")`

---

## V-05: Dashboard Sin Media Queries

| Campo | Valor |
|---|---|
| **ID** | V-05 |
| **Severidad** | 🟢 **BAJA** |
| **Componente** | Frontend Web — `Dashboard.jsx` |
| **CWE** | CWE-1104: Use of Unmaintained Third Party Components |
| **Tipo** | Maquetación |

### Descripción

El Dashboard usa grids de CSS con tamaños fijos sin media queries para adaptarse a móviles:

```javascript
gridTemplateColumns: 'repeat(4, 1fr)'  // 4 columnas fijas
```

### Impacto

- En pantallas menores a 768px, las 4 tarjetas KPI se comprimen
- El gráfico de 15 barras con `gap: 16px` desborda horizontalmente
- La tabla de usuarios no tiene scroll horizontal

### Reproducción

Abrir Dashboard en viewport de 375px (modo responsive en DevTools).

### Recomendación

```css
/* Sugerencia */
@media (max-width: 768px) {
  grid-template-columns: repeat(2, 1fr);
}
@media (max-width: 480px) {
  grid-template-columns: 1fr;
}
```

---

## V-06: Chart.js y Leaflet.js No Existen en el Proyecto

| Campo | Valor |
|---|---|
| **ID** | V-06 |
| **Severidad** | 🟡 **MEDIA** |
| **Componente** | Documentación / Planificación |
| **Tipo** | Discrepancia documentación vs. implementación |

### Descripción

La tarjeta de QA referencia explícitamente "Chart.js" y "Leaflet.js" como componentes a probar, pero **ninguna de estas librerías existe en el proyecto**:

- No están en `package.json`
- No hay importaciones en ningún archivo
- Los "gráficos" son `<div>` con altura dinámica (CSS puro)
- No existe mapa Leaflet — las ubicaciones se muestran como texto

### Impacto

- Esfuerzo de QA desperdiciado probando funcionalidad inexistente
- Confusión en la planificación del proyecto
- Las pruebas de responsividad no pueden evaluar Chart.js/Leaflet.js

### Recomendación

- Actualizar la documentación del proyecto para reflejar el stack real
- Decidir si se implementarán Chart.js y Leaflet.js en el futuro
- Mientras tanto, las pruebas responsivas deben enfocarse en los componentes existentes (barras CSS, grids, tablas)

---

## V-07: Código Muerto en ms_clima

| Campo | Valor |
|---|---|
| **ID** | V-07 |
| **Severidad** | 🟢 **BAJA** |
| **Componente** | `ms_clima/app/database/init_db.py` |
| **CWE** | CWE-477: Use of Obsolete Functions |
| **Tipo** | Código muerto |

### Descripción

El archivo `ms_clima/app/database/init_db.py` importa `from app.models.usuario import Rol`, pero `ms_clima` no tiene tabla `rol` ni modelo `Usuario`. Es una copia incorrecta del archivo homólogo de `ms_gestion_usuarios`.

```python
# ms_clima/app/database/init_db.py — Import erróneo
from app.models.usuario import Rol  # ¡Este modelo no existe en ms_clima!
```

### Impacto

- El código no se ejecuta (el error se ignora con try/except), pero es confuso para el desarrollador
- Si en el futuro se intenta ejecutar este script, fallará con `ModuleNotFoundError`

### Recomendación

Eliminar o corregir `ms_clima/app/database/init_db.py` para que no haga referencia a modelos inexistentes.

---

## V-08: Admin Puede Auto-Eliminarse (Prevenido Parcialmente)

| Campo | Valor |
|---|---|
| **ID** | V-08 |
| **Severidad** | 🟡 **MEDIA** |
| **Componente** | `ms_gestion_usuarios` — `usuarios.py:61,82` |
| **CWE** | CWE-269: Improper Privilege Management |
| **Tipo** | Privilegios |

### Descripción

El backend previene que un admin se quite su propio rol de admin (`usuarios.py:61`), pero si hay **múltiples admins**, un admin podría degradar a otro admin a participante sin restricción adicional.

```python
if id_usuario == admin_user.id_usuario and usuario_in.id_rol == 2:
    raise HTTPException(status_code=400, detail="No puedes quitarte tu propio rol de administrador")
```

### Impacto

- Bajo: la protección existe para el caso más común
- Riesgo menor si hay múltiples admins

### Recomendación

- Considerar requerir confirmación de otro admin para cambios de rol críticos
- Mantener al menos un admin irreducible en el sistema

---

## Mapa de Calor de Vulnerabilidades

```
CRÍTICA  ████████████████████  V-02 (ms_eventos sin JWT)
ALTA     ████████████████      V-01 (RBAC frontend client-side)
MEDIA    ██████████            V-03 (sin interceptor 401)
MEDIA    ██████████            V-04 (sin logging 403)
MEDIA    ██████████            V-06 (Chart.js/Leaflet.js no existen)
MEDIA    ██████████            V-08 (auto-eliminación admin)
BAJA     ██████                V-05 (Dashboard sin media queries)
BAJA     ██████                V-07 (código muerto ms_clima)
```

---

## Prioridad de Corrección

| Prioridad | Vulnerabilidad | Acción |
|---|---|---|
| 🔴 **P1** | V-02 | Eliminar exposición puerto 8002 o agregar JWT en ms_eventos |
| 🔴 **P1** | V-01 | Centralizar autenticación con AuthContext + validación backend |
| 🟡 **P2** | V-03 | Agregar interceptor 401 en axios |
| 🟡 **P2** | V-04 | Agregar logging de accesos denegados |
| 🟡 **P2** | V-06 | Actualizar documentación o implementar librerías |
| 🟢 **P3** | V-05 | Agregar media queries al Dashboard |
| 🟢 **P3** | V-07 | Limpiar código muerto en ms_clima |
| 🟢 **P3** | V-08 | Evaluar política de degradación de admins |
