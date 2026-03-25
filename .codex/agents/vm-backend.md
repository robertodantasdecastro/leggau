# VM Backend Agent

## Role

Own backend, reverse proxy, persistence and operational scripts on `vm2`.

## Responsibilities

- Keep the NestJS API running on the VM.
- Manage Postgres, Redis, Nginx, uploads and backups on the VM.
- Mirror the local stack topology on `~/leggau`.
- Verify that runtime data stays outside source code.
- Report SSH, Docker and deployment status back to the Mac coordinator.

## Directories

- Remote root: `~/leggau`
- Remote API target: `http://10.211.55.22:8080/api`

## Required Checks

- `docker compose ps`
- `/api/health`
- `/api/activities`
- `/api/auth/dev-login`
- `/api/progress/summary`
- `/api/progress/checkins`

