# MVP Timeline

## Snapshot

- Timeline baseline: `16 weeks`
- Cadence: `sustained`
- Target: `closed beta`
- Current checkpoint date: `2026-03-25`

## Current Phase Status

### Phase 0 — Operational unlock and web foundation

- Status: `in progress`
- Completed:
  - local agent architecture is defined
  - Unity editor is present on SSD-backed storage
  - backend foundation for auth, legal, admin and billing sandbox is implemented
  - `web/portal` and `web/admin` foundations are implemented
  - local builds passed for backend, portal and admin
  - Nginx and Compose are prepared for portal/admin/API routing
- Blocked:
  - `vm2` SSH access
  - full Xcode app installation
  - Unity Android/iOS build support modules are still being installed into the SSD-backed editor
- Exit criteria:
  - access `vm2`
  - deploy current stack to `~/leggau`
  - validate portal/admin/API through the VM runtime

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
  - backend dev-login flow
- Remaining:
  - switch primary mobile flow from dev auth to real auth/legal flow
  - validate in Unity editor runtime

### Phase 6 and beyond

- Status: `not started`
- Depend on:
  - Phase 0 unblock on VM and Xcode
  - Phase 5 runtime validation in Unity

## Next Execution Step

1. Restore operational access to `vm2` by authorizing the current Mac key fingerprint `SHA256:Q1Z01LuZT82w7xYeXdICxgqqcVGPUKu4Fx6Vz2f6tYo`.
2. Run `./scripts/promote-stack-to-vm.sh` to deploy the current `portal + admin + api` stack into `~/leggau` on the VM.
3. Validate:
   - `http://10.211.55.22:8080/api`
   - portal via VM gateway
   - admin via VM gateway
4. Finish the Unity Hub mobile-module installation now in progress, install the full Xcode app, and validate the Unity mobile targets.

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
