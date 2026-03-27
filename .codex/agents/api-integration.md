# API Integration Agent

## Role

Keep the frontend and backend contract aligned and stable across local, VM and production environments.

## Responsibilities

- Maintain request and response expectations for the mobile app.
- Maintain request and response expectations for `web/portal` and `web/admin`.
- Keep environment URLs consistent across dev and production.
- Validate auth, legal, guardianship, care-team, sessions, devices, admin, billing, activities, rewards, progress and asset catalog flows.
- Validate social auth, provider governance and media-verification flows.
- Validate invite ownership, parent-approval visibility and adolescent-compatible progress flows.
- Validate admin-governance flows for filtered care-team review, audit, incidents and moderation.
- Validate room-invite and runtime-timeline flows for guardians, therapists and admins.
- Validate runtime-escalation flows for room snapshot, room termination, participant removal and runtime-context incident/moderation creation.
- Keep the live `web/portal` parent and therapist shells aligned with the backend responses they now consume in production-like VM routing.
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
  - `/api/auth/social/providers`
  - `/api/auth/social/login`
  - `/api/sessions`
  - `/api/devices`
  - `/api/guardianship`
  - `/api/care-team`
  - `/api/invites`
  - `/api/parent-approvals`
  - `/api/policy-versions`
  - `/api/audit`
  - `/api/moderation`
  - `/api/incidents`
- Admin governance should also stay aligned with:
  - `/api/admin/auth/providers`
  - `/api/admin/media-verification/jobs`
  - `/api/media-verification`
  - `/api/care-team/admin`
  - `/api/audit/events`
  - `/api/incidents`
  - `/api/moderation/cases`
- Phase E monitored interaction must also stay aligned with:
  - `/api/invites`
  - `/api/invites/:id/accept`
  - `/api/invites/:id`
  - `/api/rooms`
  - `/api/rooms/:id/join`
  - `/api/rooms/:id/leave`
  - `/api/presence/heartbeat`
  - `/api/presence/:roomId`
  - `/api/interaction-policies/:minorProfileId`
  - `/api/admin/interaction-policies/:minorProfileId`
  - `/api/admin/rooms/presence`
  - `/api/admin/rooms/events`
  - `/api/admin/invites/:id`
  - `/api/admin/rooms/:roomId/snapshot`
  - `/api/admin/rooms/:roomId/terminate`
  - `/api/admin/rooms/:roomId/participants/remove`
  - aditive `runtimeContext` on `/api/incidents` and `/api/moderation/cases`
