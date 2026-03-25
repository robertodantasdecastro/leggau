# Leggau Project Memory

## Identity

- Project root: `/Volumes/SSDExterno/Desenvolvimento/Leggau`
- Codex local memory root: `/Volumes/SSDExterno/Desenvolvimento/Leggau/.codex`
- Git remote: `git@github.com:robertodantasdecastro/leggau.git`
- Main branch target: `main`
- Published environment branches:
  - `backend`
  - `frontend-android`
  - `frontend-ios`
- Product name: `Leggau`
- Mascot: `Gau`

## Stack

- Mobile frontend: `Unity`
- Target platforms: `Android` and `iOS`
- API/backend: `NestJS`
- Portal web: `Next.js`
- Web admin: `Next.js`
- Database: `Postgres`
- Cache/support service: `Redis`
- Reverse proxy: `Nginx`
- Local orchestration: `docker compose`
- Dev backend host target: `vm2`
- Future production host target: `leggau` on `EC2`

## Agent Topology

- Mac coordinator: `.codex/agents/mac-coordinator.md`
- Frontend mobile specialist: `.codex/agents/frontend-mobile.md`
- Blender and 3D specialist: `.codex/agents/blender-3d.md`
- Android and iOS platform specialist: `.codex/agents/android-ios.md`
- API integration specialist: `.codex/agents/api-integration.md`
- VM backend specialist: `.codex/agents/vm-backend.md`
- Future production specialist: `.codex/agents/prod-ec2.md`

## Directory Architecture

- `backend/`: NestJS API and domain modules
- `mobile/`: Unity project root
- `web/portal/`: public portal and legal/distribution surface
- `web/admin/`: technical and billing admin surface
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
- `DEV_API_BASE_URL=http://10.211.55.22:8080/api`
- `PROD_API_BASE_URL=https://api.leggau.com`
- `PROD_PORTAL_URL=https://www.leggau.com`
- `PROD_ADMIN_URL=https://admin.leggau.com`
- `DEFAULT_PARENT_EMAIL=parent@leggau.local`
- `DEFAULT_PARENT_NAME=Responsavel Demo`
- `DEFAULT_ADMIN_EMAIL=admin@leggau.local`
- `DEFAULT_ADMIN_PASSWORD=<do not persist real secret here>`
- `DEV_PORTAL_ALIAS_URL=https://portal-dev.trycloudflare.com`
- `DEV_ADMIN_ALIAS_URL=https://admin-dev.trycloudflare.com`
- `BILLING_SANDBOX_ENABLED=true`

## Operational Commands

- Local full stack: `docker compose up --build -d`
- Local stack status: `docker compose ps`
- Local stack stop: `docker compose down`
- Backend build: `cd backend && npm run build`
- Backend local no-containers fallback: `cd backend && npm run start:local`
- Gau asset generation: `./scripts/build-gau-asset.sh`
- Unity bootstrap scene: `./scripts/build-unity-bootstrap.sh`
- Portal build: `cd web/portal && npm run build`
- Admin build: `cd web/admin && npm run build`
- Safe local cleanup: `./scripts/cleanup-dev-storage.sh`
- VM Codex sync: `./scripts/sync-codex-to-vm.sh`
- Environment report: `./scripts/report-environment-status.sh`
- Cloudflare dev alias sync: `./scripts/sync-cloudflare-dev-alias.sh`

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

As of `2026-03-25`:

- Official dev backend target is `vm2` at `10.211.55.22`.
- Backend infrastructure must run on `vm2` under `~/leggau`.
- Local backend remains fallback-only at `http://localhost:8080/api` and should stay off on the Mac unless the VM path is blocked.
- `vm2` resolves to `10.211.55.22`, but SSH authentication is currently blocked for all known local keys.
- Latest SSH debug confirms the server offers `publickey,password` and rejects the current `id_ed25519` identity.
- `leggau` production alias is still reserved as future target, not validated here.
- Mac toolchain status:
  - Docker: ready
  - Java 17: present
  - `adb`: present
  - Unity Hub: installed
  - Unity editor detected on SSD at `.data/tooling/unity/editors/6000.4.0f1/Unity.app`
  - Unity Hub templates are symlinked to `.data/tooling/unityhub/Templates`
  - Blender `4.5.1 LTS`: installed
  - `xcodebuild`: command line tools only
- Gau asset pipeline is now versioned:
  - `mobile/Assets/Art/Characters/Gau/Source/Gau.blend`
  - `mobile/Assets/Art/Characters/Gau/Exports/Gau.fbx`
- Heavy project files must stay on the external SSD under `/Volumes/SSDExterno/Desenvolvimento/Leggau`.
- Local Docker persistence must stay under `./.data/docker/`, not Docker named volumes on the internal disk.
- Cleanup and sync routines are now repository-owned scripts so the Mac coordinator and remote agents can rerun them consistently.

## Secrets Policy

- Do not store real secrets in this file.
- Do not store real passwords, private keys, tokens or connection strings in the repository.
- Keep only names, placeholders, hosts, ports, aliases and usage conventions in project memory.

## Development Defaults

- Treat `mobile/` as the authoritative Unity root.
- Treat `backend/` as the authoritative API root.
- Treat `/Volumes/SSDExterno/Desenvolvimento/Leggau` as the canonical storage root for all large project files.
- Route mobile development traffic through `http://10.211.55.22:8080/api`, with localhost only as fallback.
- Keep uploads outside source code and serve them through `/uploads/`.
- Keep VM bootstrap rooted at `~/leggau`.
- Treat `.codex/AGENTS.md` and `.codex/memory/*.md` as the primary agent memory for this repository.
- On each completed delivery, update recursive project memory and create a Git commit.
