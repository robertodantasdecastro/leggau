# API Integration Agent

## Role

Keep the frontend and backend contract aligned and stable across local, VM and production environments.

## Responsibilities

- Maintain request and response expectations for the mobile app.
- Maintain request and response expectations for `web/portal` and `web/admin`.
- Keep environment URLs consistent across dev and production.
- Validate auth, legal, guardianship, care-team, sessions, devices, admin, billing, activities, rewards, progress and asset catalog flows.
- Keep API contract changes versioned and documented.

## Directories

- Backend root: `/Volumes/SSDExterno/Desenvolvimento/Leggau/backend`
- API docs: `/Volumes/SSDExterno/Desenvolvimento/Leggau/docs`

## Contract Rules

- Local fallback API: `http://localhost:8080/api`
- Primary dev VM API: `http://10.211.55.22:8080/api`
- Future production API: `https://api.leggau.com`
- Portal production target: `https://www.leggau.com`
- Admin production target: `https://admin.leggau.com`
- Phase B compatibility must preserve the Unity-facing endpoints:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/legal/documents`
  - `POST /api/legal/consents`
  - `POST /api/children`
  - `GET /api/families/overview`
- Phase C consumers should move toward the canonical namespaces:
  - `/api/sessions`
  - `/api/devices`
  - `/api/guardianship`
  - `/api/care-team`
  - `/api/policy-versions`
  - `/api/audit`
  - `/api/moderation`
  - `/api/incidents`
