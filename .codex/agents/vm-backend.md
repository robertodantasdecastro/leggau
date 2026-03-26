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
- `/api/admin/auth/providers`
- `/api/admin/media-verification/jobs`
- `/api/media-verification`
- `/api/activities`
- `/api/progress/summary`
- `/api/progress/checkins`

## Runtime Notes

- Phase B sign-off is authoritative only on the Postgres-backed VM runtime.
- The local `sqljs` fallback may still be useful for limited debugging, but it is not a release gate for the multiactor schema.
- The social-auth and verification checkpoint is also authoritative only on `vm2`, because provider config, masked admin responses and audited verification jobs must be exercised against the real Postgres-backed runtime.
- The current Phase C portal checkpoint is also authoritative on `vm2`, because invite ownership, guardian approval visibility and adolescent progress compatibility now depend on the migrated Postgres schema.
