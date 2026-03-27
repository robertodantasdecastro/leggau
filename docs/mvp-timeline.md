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

- Status: `completed`
- Completed:
  - `app_users.role` expanded to the canonical app actor roles
  - persistent opaque sessions now run through `device_sessions`
  - password reset moved into persistent tokens and canonical namespace aliases
  - `guardian_links` now govern family/minor reads
  - `care_team_memberships` now exist with explicit admin approval gate
  - `policy_versions` now project legal documents for the current clients
  - `consent_records` now persist `policyVersionId`
  - `audit_events`, `moderation_cases` and `incidents` foundations are in runtime
  - `families/overview` and `children` now serve the Unity flow from the new source of truth
  - the VM runtime validates register, consent, child/adolescent provisioning, sessions, care-team and password reset flows
  - Google and Apple sign-in now exists for `parent_guardian` and `therapist`
  - `auth_provider_configs` and `external_identities` now govern provider-backed access
  - simulated `media_verification_jobs` now cover OCR and biometric validation flows with audit trail
- Exit criteria:
  - satisfied

### Phase C — Adult web/PWA surfaces

- Status: `completed`
- Completed:
  - provider-backed quick-auth foundation is live for `parent_guardian` and `therapist`
  - web admin already exposes provider configuration for Google and Apple/iCloud
  - legal and actor-dependency gates are now validated for adult identity flows
  - `web/portal/pais` now ships an initial parent shell for auth, consent, family overview, minor provisioning, parent-side care-team approval and session management
  - `web/portal/profissionais` now ships an initial therapist shell for auth, family lookup, care-team requests and session management
  - the public provider catalog is restored to an operational state after automated negative-path security checks
  - parent shell now also ships scoped therapist invites, explicit permission ledger, selected-minor reports and quick check-in refresh
  - therapist shell now also ships invite inbox handling and clearer selected-family context before care-team requests
  - invite and parent-approval backend contracts are now consumable from the portal without breaking Unity compatibility
  - adolescent progress and check-in now work in the canonical backend runtime
  - `web/admin` now exposes the operational governance console for:
    - `care-team` review and admin approvals
    - audit trail filtering
    - incident creation and triage
    - moderation-case creation and triage
  - `/pais` now exposes a parent radar with clearer tasks and supervision priorities
  - `/profissionais` now exposes a therapist timeline for invite, guardian approval and admin approval
  - `web/portal` now ships as an installable online-first PWA with `manifest.webmanifest`, `sw.js` and responsive navigation tuned for adult mobile usage
  - the VM runtime now validates the governance routes:
    - `GET /api/care-team/admin`
    - `GET /api/audit/events`
    - `GET|POST|PATCH /api/incidents`
    - `GET|POST|PATCH /api/moderation/cases`
- Exit criteria:
  - satisfied

### Phase D — Child and adolescent Unity app

- Status: `completed`
- Completed:
  - responsible activation plus linked-minor selection inside the Unity runtime
  - local persistence for `SelectedMinor`, `ResolvedAgeBand`, `ActiveShell` and the resolved policy snapshot
  - explicit `child` shell for `6-9` and `10-12`
  - explicit `adolescent` shell for `13-17`
  - policy-aware shell gating for rooms, presence, messaging visibility and therapist participation affordances
  - VM-backed batch validation at `state=ready` for both the `child` shell and the `adolescent` shell
- Exit criteria:
  - satisfied

### Phase E — Monitored interaction and moderation

- Status: `in_progress`
- Completed in slice 1:
  - backend now exposes the first monitored interaction routes:
    - `GET /api/rooms`
    - `POST /api/rooms/:id/join`
    - `POST /api/rooms/:id/leave`
    - `POST /api/presence/heartbeat`
    - `GET /api/presence/:roomId`
  - monitored room access now respects active `GuardianLink` and, when applicable, active admin-approved `CareTeamMembership`
  - `InteractionPolicy` now governs runtime room listing, room join and presence heartbeat behavior, not only UI visibility
  - Unity now persists and renders available rooms, active room, presence state and room availability messaging in the one-scene runtime
  - `scripts/test-monitored-interactions.mjs` now validates child and adolescent room/presence flow against `vm2`
- Remaining:
  - parent and therapist controls around monitored interaction
  - invite-driven room entry refinement
  - moderation pipeline deeper than the current audit-first monitored surface
  - richer room/presence UX and supervision affordances

### Phase F — Billing, admin and beta readiness

- Status: `partially advanced`
- Completed:
  - admin provider configuration surface for Google and Apple/iCloud
  - admin monitoring surface for OCR and biometric verification jobs
  - dependency audits and end-to-end social-auth security validation script
- Remaining:
  - broader admin expansion
  - subscriptions and billing flows
  - deeper security and compliance readiness
  - closed beta launch gate

## Next Execution Step

1. Continue Phase E from the now-live rooms/presence slice.
2. Add caregiver and therapist supervision controls on top of the audited monitored-room runtime.
3. Preserve the completed Phase C portal/admin surfaces and the completed Phase D Unity shells as stable foundations.
4. Keep Phase F admin/compliance/billing hardening as a parallel operational thread on top of the live governance console.

## Branch and Delivery Rule

- Every phase checkpoint must update:
  - `docs/development-status.md`
  - `.codex/memory/project.md`
  - `.codex/memory/infra.md`
  - `docs/mvp-timeline.md`
- Every completed delivery must also:
  - refresh canonical docs affected by the delivery
  - refresh agent and sub-agent continuity when topology or sequencing changed
  - preserve repository memory as the source of truth before closing the checkpoint
- Every checkpoint is committed and pushed to:
  - `main`
  - `backend`
  - `frontend-android`
  - `frontend-ios`
