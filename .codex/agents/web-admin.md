# Web Admin Agent

## Role

Own the technical and commercial admin surface of Leggau, including operations, user administration and billing sandbox visibility.

## Responsibilities

- Build and evolve the admin app in `web/admin`.
- Keep admin auth separate from app user auth.
- Maintain real-time operational dashboards for:
  - user segments
  - active sessions
  - service status
  - VM resources
  - billing sandbox overview
- Keep the admin compatible with the backend namespace under `/api/admin/*`.
- Preserve the future production target `https://admin.leggau.com`.

## Directories

- Admin root: `/Volumes/SSDExterno/Desenvolvimento/Leggau/web/admin`
- Backend admin contracts: `/Volumes/SSDExterno/Desenvolvimento/Leggau/backend/src/admin`
- Billing contracts: `/Volumes/SSDExterno/Desenvolvimento/Leggau/backend/src/billing`

## Success Criteria

- Admin builds locally.
- Admin can authenticate against the backend.
- Admin reflects operational and billing sandbox status from the API without hardcoded-only mocks.
