# Infrastructure Memory

## Local Runtime

- Start stack: `docker compose up --build -d`
- Status: `docker compose ps`
- Stop: `docker compose down`
- Local API gateway: `http://localhost:8080/api`
- Official dev backend target: `http://10.211.55.22:8080/api`
- Backend code build passes with `cd backend && npm run build`

## Validated Services

- `leggau-api`
- `leggau-nginx`
- `leggau-postgres`
- `leggau-redis`

## Validated Endpoints

- `GET /api/health`
- `GET /api/activities`
- `GET /api/assets-catalog`
- `POST /api/auth/dev-login`
- `POST /api/progress/checkins`
- `GET /api/progress/summary`

## Persistence

- Postgres data root is now configured as `./.data/docker/postgres`
- Redis data root is now configured as `./.data/docker/redis`
- Uploads stay under `./.data/uploads`
- Backups stay under `./.data/backups`
- SSD storage bootstrap script: `./scripts/bootstrap-ssd-storage.sh`
- Docker Compose now uses bind mounts inside the external SSD project root

## Remote Dev Host

- Alias: `vm2`
- Host: `10.211.55.22`
- Root expected: `~/leggau`
- Backend development should run fully on this VM when SSH is available
- Current blocker: SSH authentication rejected for all tested local keys
