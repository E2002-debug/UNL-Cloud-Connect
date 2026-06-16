# AGENTS.md — UNL-Cloud-Connect

IoT ecosystem for climate monitoring and event management at UNL. 3 FastAPI microservices + React web + Expo mobile, orchestrated via Docker Compose.

## Quick start

```bash
# Full environment (Docker)
docker compose up --build            # first time
docker compose up -d                 # subsequent runs (background)
docker compose down [-v]             # stop [and destroy volumes]

# Frontend-web standalone (requires Node 20+)
cd frontend-web && rm -rf node_modules package-lock.json && npm install && npm run dev

# Frontend-mobile standalone
cd frontend-mobile && npm install && npx expo start

# Tests (only in ms_gestion_usuarios)
cd backend/ms_gestion_usuarios && pip install -r requirements.txt && pytest tests/
```

## Architecture

- **Kong API Gateway** (DB-less, `infraestructura/kong/kong.yml`) routes:
  - `/api/auth/*` and `/api/usuarios/*` → `ms_gestion_usuarios:8000`
  - `/api/clima/*` → `ms_clima:8000`
  - `/api/eventos/*` and `/api/imagenes/*` → `ms_eventos:8000`
- **PostgreSQL** single container, 3 databases: `db_usuarios`, `db_clima`, `db_eventos` (created by `infraestructura/postgres/init.sh`)
- **Mosquitto** MQTT broker (anonymous, port 1884 host → 1883 container) for ESP32 telemetry
- **MinIO** object storage, bucket `unl-eventos-media` (auto-created public)
- **Nginx** serves frontend-web, proxies `/api/*` to Kong

## Communication flow

```
Browser → Nginx (port 80) → Kong (port 8000) → microservice (port 8000)
```

For direct microservice access (bypassing Kong): `ms-eventos` is exposed at `localhost:8002`.

## Project structure

```
UNL-Cloud-Connect/
├── AGENTS.md
├── README.md
├── LICENSE
├── resolve_conflicts.py
├── .gitattributes
├── docker-compose.yml                     # 8 services
├── docker-compose.prod.yml                # HTTPS overrides
│
├── backend/
│   ├── ms_gestion_usuarios/               # Auth & User CRUD
│   │   ├── .env                           # DB, Google Client ID, SMTP
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── app/
│   │   │   ├── main.py                    # FastAPI app
│   │   │   ├── core/    (config, security, deps, email, middleware)
│   │   │   ├── database/ (base, session, init_db)
│   │   │   ├── models/   (usuario.py)
│   │   │   ├── schemas/  (usuario.py)
│   │   │   ├── routers/  (auth.py, usuarios.py)
│   │   │   └── crud/     (crud_usuario.py)
│   │   └── tests/        (test_caja_blanca.py, test_caja_negra.py)
│   │
│   ├── ms_clima/                          # Climate/IoT telemetry
│   │   ├── .env                           # DB, Google Client ID
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── app/
│   │       ├── main.py                    # FastAPI app + MQTT lifespan
│   │       ├── core/    (config, security)
│   │       ├── database/ (base, session, init_db)
│   │       ├── models/   (clima.py)
│   │       ├── schemas/  (clima.py)
│   │       ├── routers/  (clima.py)
│   │       ├── crud/     (crud_clima.py)
│   │       └── mqtt/     (cliente.py — gmqtt)
│   │
│   └── ms_eventos/                        # Event management
│       ├── .env                           # DB, MinIO config
│       ├── dockerfile
│       ├── requirements.txt
│       └── app/
│           ├── main.py
│           ├── core/    (config, security)
│           ├── database/ (base, session)
│           ├── models/   (evento.py, imagen.py, ubicacion.py)
│           ├── schemas/  (evento.py, imagen.py, ubicacion.py)
│           ├── routers/  (eventos.py, ubicacion.py)
│           ├── crud/     (crud_evento.py, crud_imagen.py)
│           └── services/ (almacenamiento.py, notificaciones.py)
│
├── frontend-web/                          # React + Vite + Tailwind
│   ├── .env                               # VITE_GOOGLE_CLIENT_ID, VITE_API_URL
│   ├── Dockerfile / Dockerfile.prod
│   ├── nginx.conf / nginx.prod.conf
│   ├── package.json
│   ├── vite.config.js
│   ├── src/
│   │   ├── main.jsx / App.jsx
│   │   ├── components/  (AuthLayout, Button, Card, Input)
│   │   ├── pages/       (Home, Login, Register, GoogleHybrid,
│   │   │                 Recover, ResetPassword, VerificarCuenta, Dashboard)
│   │   └── services/    (api.js — Axios)
│   └── ...config files
│
├── frontend-mobile/                       # React Native (Expo)
│   ├── package.json
│   └── src/
│       ├── App.js
│       ├── components/  (Button, Input)
│       ├── screens/     (LoginScreen, RegisterScreen, GoogleHybridScreen,
│       │                 RecoverScreen, ResetPasswordScreen)
│       └── services/    (api.js — fetch)
│
└── infraestructura/
    ├── kong/            (kong.yml)
    ├── mosquitto/       (config/mosquitto.conf)
    └── postgres/        (init.sh — creates 3 databases)
```

## Backend routes

### ms_gestion_usuarios (container: `unl_ms_gestion_usuarios`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/auth/registro` | Register (sends verification email) | Public |
| POST | `/auth/verificar-cuenta?token=` | Verify email & create account | Public |
| POST | `/auth/reenviar-verificacion` | Resend verification email | Public |
| POST | `/auth/login` | Manual login (JWT) | Public |
| POST | `/auth/google-register` | Validate Google token for reg. | Public |
| POST | `/auth/registro-hibrido` | Complete hybrid Google reg. | Public |
| POST | `/auth/google` | Alias for Google login | Public |
| POST | `/auth/login-google` | Google SSO / auto-register | Public |
| POST | `/auth/solicitar-recuperacion` | Request password reset email | Public |
| POST | `/auth/restablecer-clave` | Reset password with token | Public |
| PUT | `/usuarios/me` | Update own profile | Bearer |
| GET | `/usuarios/` | List all users | Admin |
| PUT | `/usuarios/{id}` | Update any user | Admin |
| DELETE | `/usuarios/{id}` | Delete user (soft) | Admin |

### ms_clima (container: `unl_ms_clima`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/clima/actual` | Latest climate reading | Public |

### ms_eventos (container: `unl_ms_eventos`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/eventos/activos` | List active events | Public |
| GET | `/eventos/{id}` | Get event details | Public |
| POST | `/eventos/` | Create event | Admin |
| PUT | `/eventos/{id}` | Update event | Admin |
| DELETE | `/eventos/{id}` | Cancel event (soft delete) | Admin |
| POST | `/eventos/{id}/imagenes/` | Upload image (jpg/png, max 5MB) | Auth |
| POST | `/eventos/imagenes/{id}/reaccion` | Like/dislike toggle | Auth |
| GET | `/eventos/imagenes/{id}/reacciones` | Reaction summary | Public |
| GET | `/eventos/ubicaciones/` | List locations | Public |
| GET | `/eventos/ubicaciones/{id}` | Location details | Public |
| POST | `/eventos/ubicaciones/` | Create location | Admin |

## Docker Compose services (container names)

| Container | Image / Build | Host ports | Depends on |
|-----------|---------------|------------|------------|
| `unl_postgres_db` | postgres:15-alpine | 5433→5432 | - |
| `unl_mqtt_broker` | eclipse-mosquitto:1.6 | 1884→1883, 9003→9001 | - |
| `unl_minio_storage` | minio/minio:latest | 9005→9000, 9002→9001 | - |
| `unl_minio_init` | minio/mc | - | minio |
| `unl_ms_gestion_usuarios` | ./backend/ms_gestion_usuarios | - | db |
| `unl_ms_clima` | ./backend/ms_clima | - | db, mqtt-broker |
| `unl_ms_eventos` | ./backend/ms_eventos | 8002→8000 | db |
| `unl_api_gateway` | kong:3.4-ubuntu | 8000→8000, 8001→8001 | 3 MS |
| `unl_frontend_web` | ./frontend-web | 80→80 | api-gateway |

## Environment files

| File | Variables |
|------|-----------|
| `backend/ms_gestion_usuarios/.env` | `GOOGLE_CLIENT_ID`, `DATABASE_URL`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`, `MAIL_PORT`, `MAIL_SERVER`, `MAIL_STARTTLS`, `MAIL_SSL_TLS` |
| `backend/ms_clima/.env` | `DATABASE_URL`, `GOOGLE_CLIENT_ID` |
| `backend/ms_eventos/.env` | `DATABASE_URL`, `MINIO_SERVER`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `MINIO_BUCKET_NAME` |
| `frontend-web/.env` | `VITE_GOOGLE_CLIENT_ID`, `VITE_API_URL` |

## Security

- **JWT**: HS256, 1-day expiry, Bearer token in `Authorization` header
- **Rate limiting**: 50 req/min per IP, 5-min block (`app/core/middleware.py`)
- **reCAPTCHA**: v2 on registration (via `_verificar_recaptcha()`)
- **Password rules**: 8-12 chars, ≥1 uppercase, ≥1 lowercase, ≥1 digit, ≥1 special, no spaces, no "usuario"
- **Domain validation**: only `@unl.edu.ec` emails with `nombre.apellido` format
- **Age validation**: 17-60 years
- **Email verification**: required before first login
- **Google SSO**: token verified via `google-auth` library, auto-registers on first login
- **RBAC**: rol 1 = Admin, rol 2 = Participant
- **Kong Zero Trust**: injects `x-user-id` and `x-user-role` headers from JWT for ms_eventos

## Data flows

### MQTT telemetry
```
ESP32 sensor → Mosquitto (topic: unl/clima/esp32) → ms_clima (gmqtt client) → PostgreSQL db_clima
```
- Sensor registry maps MQTT topics to `id_ubicacion`
- `MQTT_BROKER_HOST` env var set via docker-compose to `mqtt-broker`

### Image upload
```
Frontend → ms_eventos → MinIO bucket unl-eventos-media → URL stored in PostgreSQL db_eventos
```
- Max 5MB, jpg/png only
- Reactions: like/dislike toggle per user per image

## Frontend details

### Frontend-web (React + Vite + Tailwind)

**Pages** (8): Home, Login, Register, GoogleHybrid, Recover, ResetPassword, VerificarCuenta, Dashboard

**Components** (4): AuthLayout, Button, Card, Input

**API calls** (`src/services/api.js` — Axios):
- Auto-injects Bearer token from localStorage
- Base URL: from `VITE_API_BASE` env var (fallback `http://localhost:8000/api`)
- Endpoints: login, loginGoogle, register, googleRegister, registroHibrido, sendRecovery, resetPassword, verificarCuenta, reenviarVerificacion, getUsers, updateUser, deleteUser, updateMe

**Scripts**: `npm run dev` (vite dev server :5173), `npm run build`, `npm run preview`

### Frontend-mobile (React Native / Expo)

**Screens** (5): LoginScreen, RegisterScreen, GoogleHybridScreen, RecoverScreen, ResetPasswordScreen

**Components** (2): Button, Input

**API calls** (`src/services/api.js` — fetch):
- Base URL: `http://localhost:8000` (no `/api` prefix, no Kong proxy)
- **Endpoint name differences from web:**
  - `/auth/recover` (web: `/auth/solicitar-recuperacion`)
  - `/auth/reset-password` (web: `/auth/restablecer-clave`)
- No JWT token management implemented

**Scripts**: `npx expo start`

## Swagger docs (via Kong)

- `http://localhost:8000/api/auth/docs`
- `http://localhost:8000/api/clima/docs`
- `http://localhost:8000/api/eventos/docs`

## Unconventional ports (host:container)

| Port mapping | Service |
|---|---|
| 5433:5432 | PostgreSQL |
| 1884:1883 | MQTT |
| 9003:9001 | MQTT WebSockets |
| 9005:9000 | MinIO API |
| 9002:9001 | MinIO console |
| 8002:8000 | ms-eventos (direct) |

## Credentials (dev)

| Service | User | Password |
|---|---|---|
| MinIO console (localhost:9002) | `minio_admin` | `minio123456` |
| PostgreSQL (all 3 DBs) | `postgres_admin` | `postgres123456` |

## Key quirks

- **Node 20+ required** for frontend-web. Use `nvm use 20`. Always delete `node_modules` + `package-lock.json` before `npm install` after cloning.
- **ms_gestion_usuarios** Docker Compose command installs extra pip packages not in `requirements.txt` (email-validator, fastapi-mail, dnspython, asyncpg). Add to `requirements.txt` if they become permanent.
- **Vite strips `console.log`** at build time (`esbuild.drop`). Don't rely on console output in production builds.
- **Mobile API base** (`frontend-mobile/src/services/api.js`) uses `http://localhost:8000` directly (no Kong proxy). Endpoint names differ slightly from web: `/auth/recover` vs `/auth/solicitar-recuperacion`, `/auth/reset-password` vs `/auth/restablecer-clave`.
- **MinIO env** is loaded from `backend/ms_eventos/.env` by both `minio` and `minio-init` services.
- **MQTT broker host** inside container network is `mqtt-broker`; set via `MS_CLIMA` environment variable `MQTT_BROKER_HOST`.
- **Git line endings**: `* text=auto eol=lf`. Shell scripts and Dockerfiles enforce LF explicitly.
- **Merge conflict helper**: `resolve_conflicts.py` auto-resolves conflict markers in specific files.
- **Kong client max body size**: 5MB (configurable via `KONG_CLIENT_MAX_BODY_SIZE`).

## Production

- `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d` for HTTPS via Let's Encrypt (domain `unl-cloud-connect.me`).
- Uses `Dockerfile.prod` for frontend-web (includes SSL config, expects certs at `/etc/letsencrypt/live/unl-cloud-connect.me/`).
