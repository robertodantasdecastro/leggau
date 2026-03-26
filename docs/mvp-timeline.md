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

### Phase A — Platform rulebook and executable compliance

- Status: `completed`
- Completed:
  - platform replan frozen for multiactor beta
  - blueprint created for Unity + web/PWA + admin
  - actor matrix documented
  - compliance/security rulebook documented
  - executable backlog documented
  - multiactor contract document created
  - authorization matrix created
  - beta feature flags frozen
  - Phase B module map created
- Exit criteria:
  - satisfied

### Phase B — Identity, links and security base

- Status: `planned`
- Scope:
  - auth, reset, sessions and devices
  - guardian links and care-team memberships
  - RBAC/ABAC
  - audit, secret handling and secure logging

### Phase C — Adult web/PWA surfaces

- Status: `planned`
- Scope:
  - parent shell
  - therapist shell
  - responsive/PWA behavior
  - supervision, reports and permissions

### Phase D — Child and adolescent Unity app

- Status: `partially advanced`
- Completed:
  - Unity bootstrap and runtime validation
  - first persistent onboarding/home flow
  - VM-backed runtime validation at `state=ready`
- Remaining:
  - child/adolescent shell split
  - age-profile presentation system
  - policy-aware interaction model

### Phase E — Monitored interaction and moderation

- Status: `planned`
- Scope:
  - rooms
  - presence
  - invites
  - moderation pipeline
  - parent and therapist controls

### Phase F — Billing, admin and beta readiness

- Status: `planned`
- Scope:
  - admin expansion
  - subscriptions and billing flows
  - security testing
  - compliance readiness
  - closed beta launch gate

## Next Execution Step

1. Execute Phase B by scaffolding backend multiactor modules from the frozen contracts, flags and authorization rules.
2. Keep `vm2` as the only development backend and treat the new docs as the canonical source for platform direction.
3. Start with identity, guardianship, care-team, legal and audit foundations before adult shells and interaction runtime.
4. Preserve the current Unity child flow as the seed of Phase D while Phase B creates the shared multiactor backend core.

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
