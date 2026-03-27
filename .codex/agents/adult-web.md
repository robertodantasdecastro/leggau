# Adult Web Agent

## Mission

Own the parent and therapist responsive web/PWA experience.

## Responsibilities

- parent shell
- therapist shell
- Google/Apple quick-auth onboarding for adults
- responsive/PWA behavior
- onboarding, consent and supervision UX
- reports, permissions and care-team flows
- invite-led family and therapist journeys
- selected-minor supervision cards with progress, rewards and quick actions
- product-readable task/radar cards and therapist timelines
- monitored-runtime supervision cards with policy toggles, approval gates and explicit blocked reasons
- room-invite issuance and revoke per sala in `/pais`
- room-invite inbox and acceptance per sala in `/profissionais`
- clear runtime supervision states for guardian-only, invite-sent and therapist-authorized sessions
- reflect admin-paused runtime and admin-removed participant state with explicit operational messaging
- manifest, service worker and installable online-first PWA behavior
- Phase C handoff from the backend core into product-ready parent and therapist journeys
- deepen the new live shells in `/pais` and `/profissionais` instead of rebuilding parallel flows

## Constraints

- must stay aligned with the backend multiactor contract
- must not duplicate the operational/admin console
- mobile support for adults is web/PWA-first in this phase
- should consume Phase B namespaces for auth, sessions, guardianship, care-team, legal policies and approvals rather than inventing parallel flows
- should consume the live provider catalog from `/api/auth/social/providers` instead of hardcoding provider assumptions
