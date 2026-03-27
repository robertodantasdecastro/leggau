# VM Backend Agent

## Role

Own backend, reverse proxy, persistence and operational scripts on `vm2`.

## Responsibilities

- Keep the NestJS API running on the VM.
- Manage Postgres, Redis, Nginx, uploads and backups on the VM.
- Mirror the local stack topology on `~/leggau`.
- Apply and validate formal backend migrations on Postgres at boot.
- Verify that runtime data stays outside source code.
- Report SSH, Docker and deployment status back to the Mac coordinator.

## Directories

- Remote root: `~/leggau`
- Remote API target: `http://10.211.55.22:8080/api`

## Required Checks

- `docker compose ps`
- `/api/health`
- `/api/auth/register`
- `/api/auth/social/providers`
- `/api/auth/social/login`
- `/api/legal/documents`
- `/api/legal/consents`
- `/api/children`
- `/api/families/overview`
- `/api/sessions`
- `/api/password-reset/request`
- `/api/care-team`
- `/api/care-team/admin`
- `/api/audit/events`
- `/api/incidents`
- `/api/moderation/cases`
- `/api/invites`
- `/api/invites/:id/accept`
- `/api/invites/:id`
- `/api/admin/auth/providers`
- `/api/admin/media-verification/jobs`
- `/api/media-verification`
- `/api/rooms`
- `/api/rooms/:id/join`
- `/api/rooms/:id/leave`
- `/api/presence/heartbeat`
- `/api/presence/:roomId`
- `/api/interaction-policies/:minorProfileId`
- `/api/admin/interaction-policies/:minorProfileId`
- `/api/admin/rooms/presence`
- `/api/admin/rooms/events`
- `/api/admin/rooms/:roomId/snapshot`
- `/api/admin/rooms/:roomId/terminate`
- `/api/admin/rooms/:roomId/participants/remove`
- `/api/admin/invites/:id`
- `/api/activities`
- `/api/progress/summary`
- `/api/progress/checkins`
- `/manifest.webmanifest`
- `/sw.js`

## Runtime Notes

- Phase B sign-off is authoritative only on the Postgres-backed VM runtime.
- The local `sqljs` fallback may still be useful for limited debugging, but it is not a release gate for the multiactor schema.
- The social-auth and verification checkpoint is also authoritative only on `vm2`, because provider config, masked admin responses and audited verification jobs must be exercised against the real Postgres-backed runtime.
- The completed Phase C portal/admin checkpoint is also authoritative only on `vm2`, because invite ownership, guardian approval visibility, adolescent progress compatibility, admin governance filters and the installable adult PWA now depend on the deployed VM runtime.
- The first Phase E monitored-room slice is also authoritative only on `vm2`, because `rooms/presence` gating depends on the live Postgres-backed multiactor runtime and VM deployment state.
- The second Phase E supervision slice is also authoritative only on `vm2`, because hard approval gates, admin policy override and live presence rows only make sense against the deployed runtime.
- The third Phase E runtime-invite slice is also authoritative only on `vm2`, because room-invite acceptance, expiry, revoke and runtime-event projection depend on the deployed API plus Nginx edge routing.
- The fourth Phase E runtime-escalation slice is also authoritative only on `vm2`, because room snapshot, room termination, participant removal and their temporary operational locks depend on the live API runtime state.
- VM promotion must use the corrected `scripts/promote-stack-to-vm.sh`, which syncs project surfaces into canonical remote directories.
- `scripts/deploy-vm.sh` now force-recreates `api`, `portal`, `admin` and `nginx`, so edge config changes inside `infra/` are applied during normal promotion.
- If the VM appears to serve stale routes after a sync, the recovery path is:
  - `docker compose build --no-cache api portal admin && docker compose up -d --force-recreate api portal admin nginx`
