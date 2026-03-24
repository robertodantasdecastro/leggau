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
- The local stack is intended as fallback only; the official dev target is now `http://10.211.55.22:8080/api`
- At the moment of this status refresh, `localhost:8080` was not responding, so the local fallback stack is currently down
- Persistence validated:
  - Compose configuration now points Postgres and Redis to `./.data/docker/` bind mounts on the external SSD
  - Uploads and backups remain under `./.data/`
  - SSD directory structure was created with `./scripts/bootstrap-ssd-storage.sh`
  - The Docker daemon still needs a controlled `docker compose down` / `up` to re-establish the local fallback stack cleanly

## vm2 Status

- SSH alias `vm2` resolves to `10.211.55.22`
- Official dev backend target: `http://10.211.55.22:8080/api`
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
- Unity Hub: installed
- Unity Editor `6000.0.71f1`: directory detected, and repair/revalidation is running through Unity Hub
- Blender `4.5.1 LTS`: installed
- Xcode CLI / `xcodebuild`: missing
- Full Xcode install is still blocked by system authentication
- Gau source asset generated in Blender:
  - `mobile/Assets/Art/Characters/Gau/Source/Gau.blend`
  - `mobile/Assets/Art/Characters/Gau/Exports/Gau.fbx`
- Gau source file was opened successfully in Blender for validation

## Current Conclusion

- Backend local remains a fallback path, but the official development backend on `vm2` is still blocked by SSH access.
- The mobile repository now has the first Gau 3D asset pipeline in place, including `.blend` and `.fbx`.
- Unity tooling is much closer, and the editor repair is in progress, but the bootstrap scene still depends on that validation finishing.
- Remote backend validation on `vm2` remains blocked by SSH authentication.
- Project memory is now intended to live primarily inside the repository, not in global Codex state.
- Heavy project files are now standardized to live inside `/Volumes/SSDExterno/Desenvolvimento/Leggau/.data`.
