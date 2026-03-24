# Infrastructure Memory

## Local Runtime

- Start stack: `docker compose up --build -d`
- Status: `docker compose ps`
- Stop: `docker compose down`
- Local API gateway: `http://localhost:8080/api`

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

- Postgres data persists in named volume `leggau_postgres_data`
- Redis data persists in named volume `leggau_redis_data`

## Remote Dev Host

- Alias: `vm2`
- Host: `10.211.55.22`
- Root expected: `~/leggau`
- Current blocker: SSH authentication rejected for all tested local keys
