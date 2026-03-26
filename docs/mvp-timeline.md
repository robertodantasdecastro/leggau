# MVP Timeline

## Snapshot

- Timeline baseline: `16 weeks`
- Cadence: `sustained`
- Target: `closed beta`
- Current checkpoint date: `2026-03-26`

## Current Phase Status

### Phase 0 — Operational unlock and web foundation

- Status: `in progress`
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
- Blocked:
  - full Xcode app installation
  - Unity Android/iOS build support modules are still missing from the validated editor
  - final visual sign-off of the bootstrap flow in the graphical editor is still pending
- Current Unity state:
  - `6000.4.0f1` is the validated runnable editor on the SSD
  - `6000.0.71f1` exists on the SSD but currently fails signature validation and should not be used yet
  - package resolution now succeeds in batchmode after cleaning `._*` artifacts from the Unity SSD install
  - the first `AssetDatabase Initial Refresh` must happen in the graphical editor
  - after that first import, `./scripts/build-unity-bootstrap.sh` now succeeds
  - a graphical launch with `RunBootstrapPlayMode` has already been exercised, but it has not yet yielded a final visual sign-off checkpoint
- Exit criteria:
  - full Xcode app install
  - Unity Android/iOS modules present in the validated editor
  - Unity onboarding flow visually revalidated in the graphical editor against the VM runtime

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

- Status: `foundation ready, integration pending`
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
- Remaining:
  - replace the current dev-automation-led onboarding with player-facing interactive inputs where needed
  - visually confirm the same flow in the graphical editor after each major UI pass

### Phase 6 and beyond

- Status: `not started`
- Depend on:
  - Phase 0 unblock on VM and Xcode
  - Phase 5 runtime validation in Unity

## Next Execution Step

1. Install and select the full `Xcode.app`.
2. Attach Android/iOS support modules to the canonical Unity editor `6000.4.0f1`.
3. Reopen the Unity project in the graphical editor and complete the visual review/sign-off of the onboarding/home composition against `http://10.211.55.22:8080/api`.
4. Add the next layer of interactive UI:
   - explicit responsible/session entry
   - consent confirmation actions
   - child naming/selection controls
5. Keep `vm2` as the only development backend and continue feature work from the VM runtime.

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
