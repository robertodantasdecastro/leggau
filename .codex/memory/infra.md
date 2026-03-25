# Infrastructure Memory

## Local Runtime

- Start stack: `docker compose up --build -d`
- Status: `docker compose ps`
- Stop: `docker compose down`
- Local API gateway: `http://localhost:8080/api`
- Local portal gateway: `http://localhost:8080/`
- Local admin gateway: `http://localhost:8080/admin/`
- Official dev backend target: `http://10.211.55.22:8080/api`
- Backend code build passes with `cd backend && npm run build`
- Backend runtime is intended to live on `vm2`; the local stack is fallback-only

## Validated Services

- `leggau-api`
- `leggau-portal`
- `leggau-admin`
- `leggau-nginx`
- `leggau-postgres`
- `leggau-redis`

## Validated Endpoints

- `GET /api/health`
- `GET /api/activities`
- `GET /api/assets-catalog`
- `GET /api/legal/documents`
- `POST /api/auth/register`
- `POST /api/admin/auth/login`
- `GET /api/admin/overview`
- `GET /api/admin/billing/overview`
- `POST /api/admin/dev/cloudflare-alias/sync`
- `POST /api/auth/dev-login`
- `POST /api/progress/checkins`
- `GET /api/progress/summary`

## Persistence

- Postgres data root is now configured as `./.data/docker/postgres`
- Redis data root is now configured as `./.data/docker/redis`
- Uploads stay under `./.data/uploads`
- Backups stay under `./.data/backups`
- Cloudflare dev alias runtime stays under `./.data/runtime/cloudflare`
- SSD storage bootstrap script: `./scripts/bootstrap-ssd-storage.sh`
- Local cleanup routine: `./scripts/cleanup-dev-storage.sh`
- Cloudflare alias sync helper: `./scripts/sync-cloudflare-dev-alias.sh`
- Docker Compose now uses bind mounts inside the external SSD project root
- Unity Hub templates are symlinked to `./.data/tooling/unityhub/Templates`
- Unity Hub downloads are mirrored under `./.data/tooling/unityhub/downloads`
- Xcode downloads should target `./.data/tooling/xcode/downloads`
- Current validated Unity runtime binary is:
  - `./.data/tooling/unity/editors/6000.4.0f1/Unity.app`
- Current validated Unity project-open path is:
  - `open -na '/Volumes/SSDExterno/Desenvolvimento/Leggau/.data/tooling/unity/editors/6000.4.0f1/Unity.app' --args -projectPath '/Volumes/SSDExterno/Desenvolvimento/Leggau/mobile'`
- Current in-progress Unity install path is:
  - `./.data/tooling/unity/editors/6000.0.71f1/Unity.app`
- Current mobile module status:
  - Android build support still missing from the validated editor
  - iOS build support still missing from the validated editor
- Current Unity install caveats:
  - `6000.0.71f1` on the SSD currently fails macOS signature validation
  - `6000.4.0f1` is the only validated runnable editor right now
  - `scripts/build-unity-bootstrap.sh` now targets the SSD-backed editor first
  - `scripts/configure-unity-project.sh` now configures identifiers, orientation, color space and build scene in batch
  - when the graphical Unity editor is open, batchmode is expected to abort because Unity does not allow a second instance for the same project
  - the Unity `Resources/PackageManager` tree on the SSD install had to be cleaned of `._*` files because they broke package resolution
  - first-import stabilization must be done in the graphical editor before retrying batch scene generation
  - after the graphical import completed, batch scene generation succeeded and produced `mobile/Assets/Scenes/Bootstrap/Bootstrap.unity`
- Unity Hub install command currently in use:
  - `'/Applications/Unity Hub.app/Contents/MacOS/Unity Hub' --headless install --version 6000.0.71f1 --architecture arm64 --module android android-sdk-ndk-tools android-open-jdk ios`
- Local Docker Desktop may need to remain stopped while the mobile editor install runs, to satisfy Unity Hub RAM requirements

## Remote Dev Host

- Alias: `vm2`
- Host: `10.211.55.22`
- Root expected: `~/leggau`
- Backend development should run fully on this VM when SSH is available
- Current blocker: SSH authentication rejected for all tested local keys
- Latest SSH debug confirms the server offers `publickey,password`, but rejects the current `id_ed25519` identity
- Current offered key fingerprint: `SHA256:Q1Z01LuZT82w7xYeXdICxgqqcVGPUKu4Fx6Vz2f6tYo`
- VM memory and docs sync should use `./scripts/sync-codex-to-vm.sh` once SSH access is restored
- Full Phase 0 promotion should use:
  - `./scripts/promote-stack-to-vm.sh`
