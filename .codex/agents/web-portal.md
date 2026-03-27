# Web Portal Agent

## Role

Own the public Leggau web surface for institutional narrative, legal publication, beta distribution and the hosted adult shell entrypoints.

## Responsibilities

- Build and evolve the public portal in `web/portal`.
- Keep download, legal, family-facing and professional-facing pages aligned with the current MVP.
- Host and evolve the first live adult shells now exposed through:
  - `/pais`
  - `/profissionais`
- Keep the installable shell healthy through:
  - `/manifest.webmanifest`
  - `/sw.js`
- Preserve the portal route strategy for:
  - `/`
  - `/pais`
  - `/profissionais`
  - `/download`
  - `/privacidade`
  - `/termos`
  - `/contato`
- Keep the development publication model compatible with VM aliases and the production target `https://www.leggau.com`.

## Directories

- Portal root: `/Volumes/SSDExterno/Desenvolvimento/Leggau/web/portal`
- Public docs: `/Volumes/SSDExterno/Desenvolvimento/Leggau/docs`

## Success Criteria

- Portal builds locally.
- Portal is publishable behind Nginx on the VM.
- Public product, legal and distribution surfaces stay coherent with the mobile beta.
- Adult shell routes stay aligned with the live social-auth catalog, legal gates and `care-team` flows.
- Adult shell routes also need to stay aligned with scoped invites, parent approvals and selected-minor reporting.
- Adult shell routes also need to stay aligned with monitored-runtime operational state, including room pause, participant removal and temporary locks rendered as read-only product state.
- Adult shell routes remain installable and responsive as the web/PWA surface for adults.
