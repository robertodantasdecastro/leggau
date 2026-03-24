# Development Status

## Snapshot

Date checked: `2026-03-24`

## Repository

- Local repository initialized in `/Volumes/SSDExterno/Desenvolvimento/Leggau`
- Remote `origin` configured as `git@github.com:robertodantasdecastro/leggau.git`
- Monorepo structure present: `backend`, `mobile`, `infra`, `docs`, `scripts`
- Local Codex memory structure present in `.codex/`
- SSD storage policy documented in `docs/storage-policy.md`

## Backend Local Status

- `npm run build` passes in `backend/`
- `docker compose up --build -d` succeeds from repository root
- Services running locally:
  - `leggau-api`
  - `leggau-nginx`
  - `leggau-postgres`
  - `leggau-redis`
- Validated endpoints through the gateway:
  - `GET /`
  - `GET /api/health`
  - `GET /api/activities`
  - `GET /api/assets-catalog`
  - `POST /api/auth/dev-login`
  - `POST /api/progress/checkins`
  - `GET /api/progress/summary`
- Persistence validated:
  - Compose configuration now points Postgres and Redis to `./.data/docker/` bind mounts on the external SSD
  - Uploads and backups remain under `./.data/`
  - SSD directory structure was created with `./scripts/bootstrap-ssd-storage.sh`
  - The running Docker daemon began timing out on direct inspection commands during this update, so the actual container remount to the SSD-backed paths should be applied on the next controlled `docker compose down` / `up`

## vm2 Status

- SSH alias `vm2` resolves to `10.211.55.22`
- Current `~/.ssh/config` points `vm2` to `~/.ssh/id_ed25519`
- Authentication fails with:
  - `id_ed25519`
  - `ChaveRobertoMrQuentinha`
  - `rdc_id_rsa`
- Real status of `~/leggau`, Docker, Compose and runtime on `vm2` is still unknown because login is blocked

## Mobile Mac Status

- Docker: ready
- Java 17: installed
- Android Debug Bridge (`adb`): installed
- Xcode CLI / `xcodebuild`: missing
- Unity / Unity Hub: not detected

## Current Conclusion

- Backend local development is operational.
- Mobile repository structure is prepared, but the Apple/Unity toolchain is not yet fully installed on this Mac.
- Remote backend validation on `vm2` remains blocked by SSH authentication.
- Project memory is now intended to live primarily inside the repository, not in global Codex state.
- Heavy project files are now standardized to live inside `/Volumes/SSDExterno/Desenvolvimento/Leggau/.data`.
