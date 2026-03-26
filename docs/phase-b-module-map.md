# Mapa de Módulos da Fase B

## Objetivo

Traduzir a Fase A em módulos implementáveis para a Fase B, sem ainda escrever a lógica de produção.

## Módulos canônicos

### Módulo de identidade

- namespaces:
  - `auth`
  - `password-reset`
  - `sessions`
  - `devices`
- consumidores:
  - Unity `child/adolescent`
  - web/PWA `parent_guardian`
  - web/PWA `therapist`
  - web admin
- primeira entrega:
  - sessão, tokens, registro por papel, sessões por dispositivo

### Módulo de vínculos

- namespaces:
  - `guardianship`
  - `care-team`
  - `invites`
  - `parent-approvals`
- consumidores:
  - web/PWA `parent_guardian`
  - web/PWA `therapist`
  - web admin
- primeira entrega:
  - vínculo responsável-menor
  - fluxo de terapeuta com aprovação admin

### Módulo legal/compliance

- namespaces:
  - `legal`
  - `consents`
  - `policy-versions`
- consumidores:
  - Unity
  - web/PWA adulta
  - web admin
- primeira entrega:
  - consentimento versionado
  - políticas publicadas
  - revogação e histórico

### Módulo de auditoria e moderação

- namespaces:
  - `moderation`
  - `audit`
  - `incidents`
- consumidores:
  - web admin
  - backend policy engine
- primeira entrega:
  - `AuditEvent`
  - `ModerationCase`
  - severidade e revisão humana

### Módulo de interação e política

- namespaces:
  - `rooms`
  - `presence`
  - `interaction-policies`
- consumidores:
  - Unity `child/adolescent`
  - web/PWA `parent_guardian`
  - web admin
- primeira entrega:
  - política efetiva por perfil
  - sala estruturada
  - presença auditável

### Módulo de media verification

- namespaces:
  - `media-verification`
- consumidores:
  - web/PWA `parent_guardian`
  - web/PWA `therapist`
  - web admin
- primeira entrega:
  - job documental
  - decisão device-first
  - revisão necessária

## Ordem de implementação da Fase B

1. identidade
2. vínculos
3. legal/compliance
4. auditoria/moderação
5. interação/política
6. media verification

## Fora da Fase B

- shells web completos de pais e terapeutas
- split visual `child/adolescent` no Unity
- salas 3D completas
- billing completo e readiness final do beta
