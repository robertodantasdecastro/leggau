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
- Own admin approvals and governance surfaces for:
  - Google and Apple/iCloud provider configuration
  - `care-team` activation
  - `policy-versions`
  - `audit`
  - `moderation`
  - `incidents`
- Own admin monitoring surfaces for:
  - `media-verification` jobs
  - provider masking and configuration health
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
- Admin can manage Google/Apple provider configs without exposing raw secrets back to the browser.
- Admin can inspect verification-job activity for OCR and biometric simulations.
- Admin is ready to consume the broader Phase C/F governance endpoints as the next execution wave starts.
