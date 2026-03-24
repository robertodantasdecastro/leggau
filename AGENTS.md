# Leggau Project Memory

## Identity

- Project root: `/Volumes/SSDExterno/Desenvolvimento/Leggau`
- Codex local memory root: `/Volumes/SSDExterno/Desenvolvimento/Leggau/.codex`
- Git remote: `git@github.com:robertodantasdecastro/leggau.git`
- Main branch target: `main`
- Product name: `Leggau`
- Mascot: `Gau`

## Stack

- Mobile frontend: `Unity`
- Target platforms: `Android` and `iOS`
- API/backend: `NestJS`
- Database: `Postgres`
- Cache/support service: `Redis`
- Reverse proxy: `Nginx`
- Local orchestration: `docker compose`
- Dev backend host target: `vm2`
- Future production host target: `leggau` on `EC2`

## Directory Architecture

- `backend/`: NestJS API and domain modules
- `mobile/`: Unity project root
- `infra/`: Nginx and operational service definitions
- `docs/`: architecture, setup, status and transition docs
- `scripts/`: bootstrap, deploy and backup scripts
- `.codex/`: local Codex memory, rules and project continuity
- `.data/`: heavy local runtime data on the external SSD, including Docker state, uploads, backups, mobile builds and art exports

## Canonical Environment Variables

Use `.env.example` as the non-sensitive source of truth.

- `COMPOSE_PROJECT_NAME=leggau`
- `API_PORT=3000`
- `NGINX_HTTP_PORT=8080`
- `DB_HOST=postgres`
- `DB_PORT=5432`
- `DB_NAME=leggau`
- `DB_USER=leggau`
- `DB_PASSWORD=<do not persist real secret here>`
- `DATABASE_SYNC=true`
- `REDIS_HOST=redis`
- `REDIS_PORT=6379`
- `REDIS_ENABLED=true`
- `POSTGRES_DATA_ROOT=./.data/docker/postgres`
- `REDIS_DATA_ROOT=./.data/docker/redis`
- `UPLOADS_ROOT=./.data/uploads`
- `BACKUP_ROOT=./.data/backups`
- `MOBILE_BUILD_ROOT=./.data/mobile/builds`
- `UNITY_CACHE_ROOT=./.data/mobile/cache`
- `BLENDER_ASSET_ROOT=./.data/art/blender`
- `DEV_API_BASE_URL=http://localhost:8080/api`
- `PROD_API_BASE_URL=https://api.leggau.com`
- `DEFAULT_PARENT_EMAIL=parent@leggau.local`
- `DEFAULT_PARENT_NAME=Responsavel Demo`

## Operational Commands

- Local full stack: `docker compose up --build -d`
- Local stack status: `docker compose ps`
- Local stack stop: `docker compose down`
- Backend build: `cd backend && npm run build`
- Backend local no-containers fallback: `cd backend && npm run start:local`

## Backend Modules

- `auth`
- `profiles`
- `families`
- `activities`
- `progress`
- `rewards`
- `assets-catalog`
- `health`
- `redis`

## Current Environment Status

As of `2026-03-24`:

- Local Docker stack on Mac is validated and running.
- Gateway responds on `http://localhost:8080/`.
- API responds on `http://localhost:8080/api`.
- Postgres and Redis are healthy in Docker.
- Progress data survives `docker compose down` / `up` because named volumes persist.
- `vm2` resolves to `10.211.55.22`, but SSH authentication is currently blocked for all known local keys.
- `leggau` production alias is still reserved as future target, not validated here.
- Mac toolchain status:
  - Docker: ready
  - Java 17: present
  - `adb`: present
  - `xcodebuild`: missing
  - Unity / Unity Hub: not detected
- Heavy project files must stay on the external SSD under `/Volumes/SSDExterno/Desenvolvimento/Leggau`.
- Local Docker persistence must stay under `./.data/docker/`, not Docker named volumes on the internal disk.

## Secrets Policy

- Do not store real secrets in this file.
- Do not store real passwords, private keys, tokens or connection strings in the repository.
- Keep only names, placeholders, hosts, ports, aliases and usage conventions in project memory.

## Development Defaults

- Treat `mobile/` as the authoritative Unity root.
- Treat `backend/` as the authoritative API root.
- Treat `/Volumes/SSDExterno/Desenvolvimento/Leggau` as the canonical storage root for all large project files.
- Route mobile development traffic through `http://localhost:8080/api`.
- Keep uploads outside source code and serve them through `/uploads/`.
- Keep VM bootstrap rooted at `~/leggau`.
- Treat `.codex/AGENTS.md` and `.codex/memory/*.md` as the primary agent memory for this repository.
- On each completed delivery, update recursive project memory and create a Git commit.
