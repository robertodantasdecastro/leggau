# MVP Timeline

## Snapshot

- Timeline baseline: `16 weeks`
- Cadence: `sustained`
- Target: `closed beta`
- Current checkpoint date: `2026-03-26`

## Current Phase Status

### Phase 0 — Operational unlock and web foundation

- Status: `completed`
- Completed:
  - local agent architecture is defined
  - Unity editor is present on SSD-backed storage
  - Leggau project now opens in the graphical Unity editor on the SSD-backed install
  - bootstrap scene now builds successfully after the first graphical import
  - backend foundation for auth, legal, admin and billing sandbox is implemented
  - `web/portal` and `web/admin` foundations are implemented
  - local builds passed for backend, portal and admin
  - Nginx and Compose are prepared for portal/admin/API routing
  - SSH automation to `vm2` is working
  - current stack is deployed to `~/leggau`
  - portal, admin and API now validate through the VM gateway
  - full `Xcode.app` is installed, selected and completed through first launch
  - the canonical Unity editor `6000.4.0f1` now exposes `AndroidPlayer` and `iOSSupport` in its top-level `PlaybackEngines/` layout
  - the bootstrap flow was revalidated in the graphical editor against the VM runtime and reached `state=ready`
- Current Unity state:
  - `6000.4.0f1` is the validated runnable editor on the SSD
  - `6000.0.71f1` exists on the SSD but currently fails signature validation and should not be used yet
  - package resolution now succeeds in batchmode after cleaning `._*` artifacts from the Unity SSD install
  - the first `AssetDatabase Initial Refresh` must happen in the graphical editor
  - after that first import, `./scripts/build-unity-bootstrap.sh` now succeeds
  - Unity Hub installs mobile modules into the editor-root `PlaybackEngines/` directory for `6000.4.0f1`
- Exit criteria:
  - satisfied

### Phase 1 — Backend identity, legal and RBAC

- Status: `started ahead of schedule`
- Completed:
  - app auth endpoints scaffolded
  - admin auth scaffolded
  - legal document and consent modules scaffolded
  - billing provider/plan/transaction modules scaffolded
- Remaining:
  - harden persistence and behavior on Postgres in VM runtime
  - extend reset-password flow from sandbox token to real email channel contract
  - add stricter RBAC and audit trails

### Phase 2 — Portal web multiuse

- Status: `started`
- Completed:
  - public pages scaffolded
  - production domain targets documented
  - dev alias runtime placeholders implemented
- Remaining:
  - connect portal texts and download flows to final beta distribution paths
  - validate portal behind VM gateway

### Phase 3 — Web admin operational

- Status: `started`
- Completed:
  - admin login
  - overview/realtime/users/billing overview endpoints
  - admin dashboard shell consuming the new endpoints
- Remaining:
  - richer operations modules
  - password reset management UI
  - legal/admin workflows
  - VM service introspection once remote access is available

### Phase 4 — Billing sandbox

- Status: `started`
- Completed:
  - providers, plans, transactions and overview endpoints
  - sandbox seed data
- Remaining:
  - webhook ingestion flow
  - provider settings UI depth
  - operational ledger refinements

### Phase 5 — Mobile MVP functional

- Status: `interactive onboarding in progress`
- Completed:
  - Unity bootstrap, Gau catalog and art variants
  - generated bootstrap scene
  - batch-configured Unity project settings and validation report
  - real auth + legal bootstrap foundation in the mobile app with dev fallback
  - first-access child bootstrap path implemented through `POST /api/children`
  - Unity Play Mode runtime reached `ready` through the bootstrap flow, with dashboard loaded and Gau session data present
  - bootstrap HUD is now organized for in-editor iteration and supports runtime retry without restarting the scene
  - onboarding/bootstrap progress is now visible as a live checklist inside the Unity HUD
  - the same backend contract is now validated on `vm2`
  - bootstrap UI now has a persistent onboarding panel and a first-home panel instead of only debug cards
  - onboarding is now action-driven instead of silent on startup
  - the bootstrap scene now exposes interactive inputs for responsible auth, consent confirmation and child naming
  - the editor driver now supports an automated development pass for repeatable validation of the onboarding flow
  - after the machine reboot and VM restart on `2026-03-26`, batch validation again reached `state=ready` against `vm2`
- Remaining:
  - refine the onboarding layout from functional UI into stronger product UI
  - persist the first-home experience as the main entry state after onboarding
  - keep validating the same flow in the graphical editor after each major UI pass

### Phase 6 and beyond

- Status: `not started`
- Depend on:
  - Phase 5 runtime validation in Unity

## Next Execution Step

1. Add the next layer of interactive UI:
   - stronger visual treatment for responsible/session entry
   - clearer consent review and acceptance copy
   - child selection/creation affordances
2. Consolidate the first persistent home as the main MVP entry experience.
3. Keep `vm2` as the only development backend and continue feature work from the VM runtime.
4. Prepare Android/iOS build validation on top of the now-complete Phase 0 toolchain.

## Branch and Delivery Rule

- Every phase checkpoint must update:
  - `docs/development-status.md`
  - `.codex/memory/project.md`
  - `.codex/memory/infra.md`
  - `docs/mvp-timeline.md`
- Every checkpoint is committed and pushed to:
  - `main`
  - `backend`
  - `frontend-android`
  - `frontend-ios`
