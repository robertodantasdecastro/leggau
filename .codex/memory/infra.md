# Infrastructure Memory

## Local Runtime

- Start stack: `docker compose up --build -d`
- Status: `docker compose ps`
- Stop: `docker compose down`
- Local API gateway: `http://localhost:8080/api`
- Official dev backend target: `http://10.211.55.22:8080/api`
- Backend code build passes with `cd backend && npm run build`
- Backend runtime is intended to live on `vm2`; the local stack is fallback-only

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
- Local cleanup routine: `./scripts/cleanup-dev-storage.sh`
- Docker Compose now uses bind mounts inside the external SSD project root
- Unity Hub templates are symlinked to `./.data/tooling/unityhub/Templates`
- Unity Hub downloads are mirrored under `./.data/tooling/unityhub/downloads`

## Remote Dev Host

- Alias: `vm2`
- Host: `10.211.55.22`
- Root expected: `~/leggau`
- Backend development should run fully on this VM when SSH is available
- Current blocker: SSH authentication rejected for all tested local keys
- Latest SSH debug confirms the server offers `publickey,password`, but rejects the current `id_ed25519` identity
- Current offered key fingerprint: `SHA256:Q1Z01LuZT82w7xYeXdICxgqqcVGPUKu4Fx6Vz2f6tYo`
- VM memory and docs sync should use `./scripts/sync-codex-to-vm.sh` once SSH access is restored
