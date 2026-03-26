# Social Auth and Verification Operations

## Scope

This checkpoint adds fast adult sign-up and sign-in through:

- Google
- Apple Sign in, represented operationally as the `apple` provider for iCloud/Apple accounts

The feature is limited to:

- `parent_guardian`
- `therapist`

`child` and `adolescent` are explicitly blocked from self-registering through social auth in this phase.

## Admin Surface

The operational control surface lives in `web/admin` and consumes:

- `GET /api/admin/auth/providers`
- `POST /api/admin/auth/providers`
- `PATCH /api/admin/auth/providers/:provider`

The admin now configures, per provider:

- `enabled`
- `verificationMode`
- `clientId`
- `issuer`
- `jwksUri`
- `audiences`
- `scopes`
- `clientSecret`
- `privateKey`
- `metadata`

Secrets are never returned raw by the API after persistence. Responses expose only masked summaries.

## Security Model

- Provider secrets are encrypted at rest.
- The encryption key must be supplied outside the repository through `AUTH_PROVIDER_SECRET_KEY`.
- Public discovery of enabled providers is limited to `GET /api/auth/social/providers`.
- Social login is executed through `POST /api/auth/social/login`.
- Verified email is required for provider-backed account creation.
- Minor self-register through social auth is rejected.
- `parent_guardian` must accept all published parent-facing policies before creating `child` or `adolescent` profiles.
- `therapist` can authenticate, but clinical access stays blocked until:
  - parent approval is granted
  - admin approval is granted

## Actor Dependency Rules

### `parent_guardian`

- may self-register with Google, Apple or password
- may create minors only after published parent policies are accepted
- receives explicit dependency and consent requirements in the auth response

### `therapist`

- may self-register with Google, Apple or password
- may not access clinical scope until the `CareTeamMembership` is approved by both parent and admin

### `child` and `adolescent`

- may not self-register through social providers in this phase
- continue to depend on active `GuardianLink` plus valid policy

## Verification Operations

The verification simulation surface currently uses:

- `POST /api/media-verification`
- `GET /api/admin/media-verification/jobs`

Supported simulated job types:

- `document_ocr`
- `biometric_face_match`

These jobs are audit-backed and intended for development, integration and security validation, not for production identity proofing.

## Fixtures

Versioned fixtures live in:

- `docs/test-fixtures/ocr/guardian-id-front.svg`
- `docs/test-fixtures/ocr/guardian-id-back.svg`
- `docs/test-fixtures/biometric/guardian-face-a.svg`
- `docs/test-fixtures/biometric/guardian-face-b.svg`
- `docs/test-fixtures/biometric/guardian-face-impostor.svg`

They are synthetic samples for OCR and biometric simulation only.

## Validation

The canonical end-to-end validation entrypoint is:

- `scripts/test-social-auth-security.mjs`

As validated on `2026-03-26`, it covers:

- admin login
- provider configuration for Google and Apple in mock mode
- public provider discovery
- password register/login compatibility
- password reset compatibility
- social register/login for `parent_guardian`
- consent gate before minor provisioning
- `child` and `adolescent` provisioning
- family overview using canonical guardian links
- social register/login for `therapist`
- parent and admin approval split for `care-team`
- persistent session listing
- OCR and biometric verification simulation
- admin secret masking
- provider disablement
- rejection of minor social self-register
- audit trail assertions
