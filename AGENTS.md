# UNL-Cloud-Connect — AGENTS.md

## Quick start
```bash
docker compose up --build   # first time
docker compose up -d        # subsequent (background)
docker compose ps           # status
docker compose down         # stop
docker compose down -v      # stop + wipe volumes
```

## Frontend Web (React + Vite + TailwindCSS)
Requires **Node.js 20+** (use `nvm use 20`).
```bash
rm -rf node_modules package-lock.json   # clean after clone
npm install
npm run dev     # local dev at http://localhost:5173
npm run build   # production build (served via Nginx in Docker)
```

## Frontend Mobile (Expo / React Native SDK 48)
```bash
cd frontend-mobile
npx expo start
```
Note: Ensure `@react-navigation/*` and `react-native-safe-area-context` are properly tested via Expo SDK 48.

## Backend — 3 FastAPI microservices under `backend/`

| Service | Entrypoint | Config pattern | Tests | Notable |
|---|---|---|---|---|
| `ms_gestion_usuarios/` | `app/main.py` | Pydantic `BaseSettings` | `python -m pytest tests/ -v` | Dockerfile has **no CMD**; installs extra pip pkgs at runtime with `--break-system-packages` |
| `ms_clima/` | `app/main.py` | Plain class + `os.getenv()` | None | `.env` NOT auto-loaded; MQTT via `gmqtt`; hardcoded `GOOGLE_CLIENT_ID` in code |
| `ms_eventos/` | `app/main.py` | Pydantic `BaseSettings` | None | Dockerfile is **lowercase** (`dockerfile`); uses `python:3.11-slim`; sync startup (no `lifespan`); MinIO integration |

All three use `root_path="/api"` — routes are at `/api/auth/`, `/api/clima/`, `/api/eventos/`.

## API Gateway (Kong DB-less) — `infraestructura/kong/kong.yml`
```yaml
/api/auth/*, /api/usuarios/*  →  ms-gestion-usuarios:8000
/api/clima/*                  →  ms-clima:8000
/api/eventos/*, /api/imagenes/* →  ms-eventos:8000
```
Kong config is static; restart Kong container to reload.

## Infrastructure — `infraestructura/`
- **PostgreSQL** — single instance, 3 databases: `db_usuarios`, `db_clima`, `db_eventos`. Host port: `5433`.
- **Mosquitto MQTT** — anonymous auth, host port: `1884`.
- **MinIO** — host ports: `9005` (API), `9002` (console). Bucket: `unl-eventos-media`. Credentials: `minio_admin` / `minio123456`.

## Testing
Only `ms_gestion_usuarios` has tests (white-box + black-box via `TestClient`):
```bash
cd backend/ms_gestion_usuarios
python -m pytest tests/ -v
```

## QA / Security scripts
```bash
qa/scripts/test_rbac_backend.sh    # RBAC bypass tests (targets ms_eventos:8002)
qa/scripts/test_rbac_frontend.sh   # localStorage manipulation tests
```

## Solved Security Issues & Notes
- ~~`ms_eventos` port 8002 exposed on host~~ (Fixed: Closed and routed properly through Kong).
- ~~`ms_eventos` lacking JWT validation~~ (Fixed: JWT validated securely).
- ~~Frontend RBAC client-side only (CWE-602)~~ (Mitigated: Backend properly validates JWT. Frontend still uses localStorage for UI logic only).
- `.env` naming mismatch: frontend `.env` uses `VITE_API_URL`, Dockerfile args use `VITE_API_BASE`.
- `resolve_conflicts.py` at repo root auto-fixes git merge markers in known source files.
