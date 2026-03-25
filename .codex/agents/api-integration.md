# API Integration Agent

## Role

Keep the frontend and backend contract aligned and stable across local, VM and production environments.

## Responsibilities

- Maintain request and response expectations for the mobile app.
- Maintain request and response expectations for `web/portal` and `web/admin`.
- Keep environment URLs consistent across dev and production.
- Validate auth, legal, admin, billing, activities, rewards, progress and asset catalog flows.
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
