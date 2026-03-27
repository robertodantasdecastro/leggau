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
- Adult web/PWA specialist: `.codex/agents/adult-web.md`
- Safety and compliance specialist: `.codex/agents/safety-compliance.md`
- Blender and 3D specialist: `.codex/agents/blender-3d.md`
- Android and iOS platform specialist: `.codex/agents/android-ios.md`
- API integration specialist: `.codex/agents/api-integration.md`
- Web portal specialist: `.codex/agents/web-portal.md`
- Web admin specialist: `.codex/agents/web-admin.md`
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
- `DEV_API_ALIAS_URL=https://api-dev.trycloudflare.com`
- `DEV_API_BASE_URL=http://10.211.55.22:8080/api`
- `PROD_API_BASE_URL=https://api.leggau.com`
- `PROD_PORTAL_URL=https://www.leggau.com`
- `PROD_ADMIN_URL=https://admin.leggau.com`
- `AUTH_PROVIDER_SECRET_KEY=<do not persist real secret here>`
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
- `password-reset`
- `sessions`
- `devices`
- `guardianship`
- `care-team`
- `invites`
- `parent-approvals`
- `policy-versions`
- `interaction-policies`
- `rooms`
- `identity-providers`
- `media-verification`
- `audit`
- `moderation`
- `incidents`
- `profiles`
- `families`
- `activities`
- `progress`
- `rewards`
- `assets-catalog`
- `health`
- `redis`

## Current Environment Status

As of `2026-03-27`:

- Official dev backend target is `vm2` at `10.211.55.22`.
- Canonical sign-off endpoint for development clients is now the HTTPS API alias exposed through Cloudflare on `vm2`.
- Backend infrastructure must run on `vm2` under `~/leggau`.
- Local backend remains fallback-only at `http://localhost:8080/api` and should stay off on the Mac unless the VM path is blocked.
- The authoritative Phase B backend validation path is now Postgres on `vm2`; the local `sqljs` fallback is not a reliable sign-off path for the timestamp-heavy multiactor schema.
- `vm2` SSH automation is working again and the active runtime root is `~/leggau`.
- The full remote stack is validated on the VM:
  - `leggau-api`
  - `leggau-portal`
  - `leggau-admin`
  - `leggau-nginx`
  - `leggau-postgres`
  - `leggau-redis`
- Gateway validation now passes on `10.211.55.22:8080` for:
  - `/`
  - `/pais`
  - `/profissionais`
  - `/admin`
  - `/manifest.webmanifest`
  - `/sw.js`
  - `/api/health`
  - onboarding and content endpoints used by the Unity runtime
- The Cloudflare dev aliases are now also live and synchronized from the VM deployment flow:
  - `DEV_PORTAL_ALIAS_URL`
  - `DEV_ADMIN_ALIAS_URL`
  - `DEV_API_ALIAS_URL`
- `leggau` production alias is still reserved as future target, not validated here.
- The product is now being planned as a multiactor platform:
  - Unity for `child` and `adolescent`
  - responsive web/PWA for `parent_guardian` and `therapist`
  - web admin for operations, compliance, moderation and billing
- Phase B runtime is now live on the VM with:
  - opaque persistent sessions in `device_sessions`
  - `GuardianLink` as the canonical guardian-to-minor source of truth
  - `CareTeamMembership` with parent and admin approval gates
  - `policy_versions` projecting published legal policies and consent versions
  - `audit_events` and base moderation/incident tables for security tracing
  - provider-governed Google and Apple/iCloud sign-in for `parent_guardian` and `therapist`
  - `external_identities` linking provider subjects to app actors
  - audited OCR and biometric simulation jobs for verification readiness
- The current adult-auth checkpoint is now also live on the VM:
  - `web/admin` exposes provider configuration for Google and Apple/iCloud
  - provider secrets are masked in responses and encrypted at rest behind `AUTH_PROVIDER_SECRET_KEY`
  - `scripts/test-social-auth-security.mjs` validates social auth, legal gates, actor links, OCR and biometrics against `vm2`
  - `npm audit --omit=dev` is clean for `backend`, `web/admin` and `web/portal`
- Phase C is now completed in `web/portal` and `web/admin`:
  - `/pais` is a live parent shell for auth, consent, family overview, minor provisioning, parent-side care-team approvals, reports, invites and permission ledger
  - `/profissionais` is a live therapist shell for auth, family lookup, invite acceptance, care-team requests and clinical-context timeline
  - `web/admin` is now the live governance console for care-team review, audit, incidents, moderation, provider config and verification jobs
  - `web/portal` now ships `manifest.webmanifest` and `sw.js` for the adult PWA shell
  - the automated security script restores the Google/Apple catalog after negative-path checks so the adult shells stay operational
- Phase D is now completed on Unity:
  - the runtime enters through responsible activation, family load, minor selection and policy load
  - explicit `child` and `adolescent` shells now exist in the same `Bootstrap.unity`
  - the age-profile presentation system now differentiates `6-9`, `10-12` and `13-17`
  - the runtime now persists `SelectedMinor`, `ResolvedAgeBand`, `ActiveShell` and the resolved policy snapshot
  - the VM-backed probe now validates both `child` and `adolescent` shells at `state=ready`
- Phase E is now in progress through the first five monitored-interaction slices:
  - backend now exposes `rooms` and `presence` routes on top of the policy-aware multiactor runtime
  - Unity now consumes monitored room catalog and monitored presence state inside the same `Bootstrap.unity`
  - `presence_enabled` is now a hard gate for room listing, join and heartbeat
  - therapist runtime access now also requires active `therapist_linking` and `therapistParticipationAllowed=true`
  - admin now owns emergency policy override and live runtime visibility through `/api/admin/interaction-policies/:minorProfileId` and `/api/admin/rooms/presence`
  - therapist runtime participation now also requires an accepted `monitored_room` invite scoped by `minorProfileId + roomId`
  - admin now owns the runtime-event timeline through `/api/admin/rooms/events` and emergency room-invite revoke through `/api/admin/invites/:id`
  - admin now also owns room snapshot, room termination and per-participant removal through:
    - `/api/admin/rooms/:roomId/snapshot`
    - `/api/admin/rooms/:roomId/terminate`
    - `/api/admin/rooms/:roomId/participants/remove`
  - incidents and moderation cases can now be opened directly from runtime context, without manual context reconstruction
  - monitored runtime now also projects explicit lifecycle states:
    - `active`
    - `stale`
    - `closed_by_timeout`
    - `closed_by_admin`
    - `participant_removed`
  - `GET /api/rooms`, `GET /api/presence/:roomId`, `GET /api/admin/rooms/:roomId/snapshot` and `GET /api/admin/rooms/events` now also expose:
    - `sessionStatus`
    - `participantStatus`
    - `heartbeatTimeoutAt`
    - `endedAt`
    - `endedBy`
    - `closeReason`
  - canonical runtime validation now also includes `scripts/test-runtime-lifecycle.mjs` against the HTTPS API alias
  - Unity now prefers `DEV_API_ALIAS_URL` for sign-off and keeps the raw VM IP only as fallback for editor/development recovery
  - Unity transport hardening now restricts insecure HTTP fallback to editor/development flows instead of leaving cleartext broadly enabled
  - the adult portal/admin surfaces now render runtime lifecycle, timeout and close-reason states more explicitly
  - chat and end-to-end encryption remain intentionally out of this slice and are the next security/product architecture track
  - the VM edge proxy was corrected so `/`, `/pais`, `/profissionais`, `/manifest.webmanifest` and `/sw.js` remain healthy after the room-invite rollout
  - adult web/admin remain in maintenance and continued polish while supervision and moderation grow around the monitored runtime
- Mac toolchain status:
  - Docker: ready
  - Java 17: present
  - `adb`: present
  - Unity Hub: installed
  - Unity editor detected on SSD at `.data/tooling/unity/editors/6000.4.0f1/Unity.app`
  - Unity mobile modules validated in `PlaybackEngines/AndroidPlayer` and `PlaybackEngines/iOSSupport`
  - Unity Hub templates are symlinked to `.data/tooling/unityhub/Templates`
- Blender `4.5.1 LTS`: installed
- `Xcode.app`: installed and selected at `/Applications/Xcode.app`
- `xcodebuild -version`: `Xcode 26.4`
- Android emulator/AVD: not currently provisioned on the Mac
- iOS simulator runtimes: no available devices listed right now
- Gau asset pipeline is now versioned:
  - `mobile/Assets/Art/Characters/Gau/Source/Gau.blend`
  - `mobile/Assets/Art/Characters/Gau/Exports/Gau.fbx`
- Latest validated Unity runtime probe against the VM reached:
  - child shell:
    - `state=ready`
    - `status=Shell carregada.`
    - `childName=Gau`
    - `minorRole=child`
    - `ageBand=6-9`
    - `activeShell=child`
    - `availableRoomCount=1`
    - `sessionStatus=closed_by_timeout`
    - `closeReason=Sessao encerrada por ausencia de heartbeat.`
  - adolescent shell:
    - `state=ready`
    - `status=Shell carregada.`
    - `childName=Gau Teen`
    - `minorRole=adolescent`
    - `ageBand=13-17`
    - `activeShell=adolescent`
    - `availableRoomCount=2`
    - `sessionStatus=closed_by_timeout`
    - `closeReason=Sessao encerrada por ausencia de heartbeat.`
- Canonical Unity batch validation for child/adolescent shells must run sequentially on the same project; parallel runs can collide on `Library/Bee`.
- Platform replan artifacts are now canonical docs:
  - `docs/platform-blueprint.md`
  - `docs/actor-matrix.md`
  - `docs/compliance-rulebook.md`
  - `docs/platform-backlog.md`
- Phase B executable contract artifacts are now canonical docs:
  - `docs/platform-contracts.md`
  - `docs/authorization-matrix.md`
  - `docs/beta-feature-flags.md`
  - `docs/phase-b-module-map.md`
- Heavy project files must stay on the external SSD under `/Volumes/SSDExterno/Desenvolvimento/Leggau`.
- Local Docker persistence must stay under `./.data/docker/`, not Docker named volumes on the internal disk.
- Cleanup and sync routines are now repository-owned scripts so the Mac coordinator and remote agents can rerun them consistently.
- `scripts/promote-stack-to-vm.sh` now syncs project surfaces into canonical remote directories and the no-cache VM rebuild fallback is:
  - `ssh vm2 'cd ~/leggau && docker compose build --no-cache api portal admin && docker compose up -d --force-recreate api portal admin nginx'`

## Secrets Policy

- Do not store real secrets in this file.
- Do not store real passwords, private keys, tokens or connection strings in the repository.
- Keep only names, placeholders, hosts, ports, aliases and usage conventions in project memory.

## Development Defaults

- Treat `mobile/` as the authoritative Unity root.
- Treat `web/portal/` as the authoritative public portal root.
- Treat `web/admin/` as the authoritative admin console root.
- Treat `backend/` as the authoritative API root.
- Treat `/Volumes/SSDExterno/Desenvolvimento/Leggau` as the canonical storage root for all large project files.
- Route mobile development traffic through `DEV_API_ALIAS_URL` when available; keep `DEV_API_BASE_URL` as the explicit VM-IP fallback for editor/development recovery only.
- Keep uploads outside source code and serve them through `/uploads/`.
- Keep VM bootstrap rooted at `~/leggau`.
- Treat `.codex/AGENTS.md` and `.codex/memory/*.md` as the primary agent memory for this repository.
- Treat `docs/mvp-timeline.md` as the authoritative delivery timeline document.
- On each completed delivery, execute the full completion protocol:
  - update the global development plan in `docs/mvp-timeline.md`
  - update status and canonical docs when the delivery changes project direction or scope
  - refresh recursive memory in `.codex/memory/`
  - refresh agent and sub-agent continuity when topology, ownership or execution order changes
  - save the checkpoint in Git and push `main`, `backend`, `frontend-android` and `frontend-ios`
