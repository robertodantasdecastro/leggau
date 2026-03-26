# Contratos Multiactor da Plataforma

## Objetivo

Congelar os contratos canônicos da plataforma Leggau para implementação a partir da Fase B, sem ainda escrever o runtime definitivo.

## Tipos canônicos

### `ActorRole`

- `child`
- `adolescent`
- `parent_guardian`
- `therapist`
- `admin`
- `support_admin`

### `AgeBand`

- `6-9`
- `10-12`
- `13-17`

### Status mínimos

#### Vínculos

- `pending`
- `active`
- `revoked`
- `suspended`

#### Consentimentos

- `draft`
- `published`
- `accepted`
- `revoked`
- `expired`

#### Incidentes e moderação

- `open`
- `triaged`
- `blocked`
- `resolved`

## Entidades canônicas

### `GuardianLink`

- objetivo: vínculo entre `parent_guardian` e `child` ou `adolescent`
- campos mínimos:
  - `id`
  - `parentUserId`
  - `minorProfileId`
  - `minorRole`
  - `status`
  - `approvedAt`
  - `revokedAt`
  - `createdBy`
  - `auditContext`

### `CareTeamMembership`

- objetivo: vínculo entre `therapist` e família/perfil infantojuvenil
- campos mínimos:
  - `id`
  - `therapistUserId`
  - `parentUserId`
  - `minorProfileId`
  - `status`
  - `adminApprovalStatus`
  - `parentApprovalStatus`
  - `scope`
  - `approvedAt`
  - `revokedAt`

### `InteractionPolicy`

- objetivo: política efetiva de presença, salas e interação
- campos mínimos:
  - `id`
  - `minorProfileId`
  - `ageBand`
  - `roomsEnabled`
  - `presenceEnabled`
  - `messagingMode`
  - `therapistParticipationAllowed`
  - `guardianOverride`
  - `effectiveFrom`
  - `effectiveTo`

### `ConsentVersion`

- objetivo: versionar textos, aceite e revogação
- campos mínimos:
  - `id`
  - `documentKey`
  - `version`
  - `status`
  - `audience`
  - `publishedAt`
  - `supersededBy`

### `AuditEvent`

- objetivo: trilha auditável central
- campos mínimos:
  - `id`
  - `eventType`
  - `actorRole`
  - `actorUserId`
  - `resourceType`
  - `resourceId`
  - `outcome`
  - `severity`
  - `occurredAt`
  - `metadata`

### `ModerationCase`

- objetivo: registrar classificação, bloqueio e revisão humana
- campos mínimos:
  - `id`
  - `sourceType`
  - `sourceId`
  - `status`
  - `severity`
  - `policyCode`
  - `aiDecision`
  - `humanReviewRequired`
  - `reviewedBy`
  - `reviewedAt`

### `RoomPermission`

- objetivo: autorização para salas estruturadas
- campos mínimos:
  - `id`
  - `roomType`
  - `actorRole`
  - `actorUserId`
  - `minorProfileId`
  - `status`
  - `policySource`
  - `grantedAt`
  - `expiresAt`

### `DeviceSession`

- objetivo: sessão/autorização por dispositivo
- campos mínimos:
  - `id`
  - `userId`
  - `actorRole`
  - `deviceId`
  - `deviceType`
  - `sessionStatus`
  - `lastSeenAt`
  - `revokedAt`

### `MediaVerificationJob`

- objetivo: OCR/captura documental e validação com processamento local-first
- campos mínimos:
  - `id`
  - `jobType`
  - `submittedBy`
  - `deviceProcessingMode`
  - `evidenceLocation`
  - `status`
  - `resultSummary`
  - `reviewRequired`
  - `createdAt`

## Regras de entrada e ativação

- `child` e `adolescent` nunca concluem onboarding sem `GuardianLink.status = active`
- `therapist` nunca ganha acesso clínico sem `CareTeamMembership.status = active`
- `CareTeamMembership` só pode ser `active` quando houver aprovação administrativa no beta
- `parent_guardian` pode criar e administrar perfis infantis, mas não pode elevar permissões clínicas fora da política vigente

## Contratos por namespace

### `auth`

- atores: todos os autenticáveis
- operações:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
  - `POST /api/auth/logout`
- objetos mínimos:
  - request: `email`, `password`, `role`, `profileDraft`
  - response: `accessToken`, `refreshToken`, `actorRole`, `session`
- auditoria:
  - `auth.registered`
  - `auth.logged_in`
  - `auth.refresh_issued`
  - `auth.logged_out`

### `password-reset`

- atores: `parent_guardian`, `therapist`, `admin`, `support_admin`
- operações:
  - `POST /api/password-reset/request`
  - `POST /api/password-reset/confirm`
- objetos mínimos:
  - request: `email` ou `resetToken`, `newPassword`
  - response: `status`, `expiresAt`
- auditoria:
  - `auth.password_reset_requested`
  - `auth.password_reset_completed`

### `sessions`

- atores: todos os autenticáveis
- operações:
  - `GET /api/sessions`
  - `DELETE /api/sessions/:id`
- objetos mínimos:
  - response: `DeviceSession[]`
- auditoria:
  - `session.listed`
  - `session.revoked`

### `devices`

- atores: todos os autenticáveis
- operações:
  - `POST /api/devices/register`
  - `PATCH /api/devices/:id`
- objetos mínimos:
  - request: `deviceId`, `platform`, `capabilities`
  - response: `deviceSession`
- auditoria:
  - `device.registered`
  - `device.updated`

### `guardianship`

- atores: `parent_guardian`, `admin`, `support_admin`
- operações:
  - `POST /api/guardianship`
  - `GET /api/guardianship`
  - `PATCH /api/guardianship/:id`
- objetos mínimos:
  - request: `minorProfileId`, `minorRole`, `statusIntent`
  - response: `GuardianLink`
- auditoria:
  - `guardianship.created`
  - `guardianship.updated`
  - `guardianship.revoked`

### `care-team`

- atores: `therapist`, `parent_guardian`, `admin`, `support_admin`
- operações:
  - `POST /api/care-team`
  - `GET /api/care-team`
  - `PATCH /api/care-team/:id`
- objetos mínimos:
  - request: `minorProfileId`, `therapistUserId`, `scope`
  - response: `CareTeamMembership`
- auditoria:
  - `care_team.requested`
  - `care_team.approved_by_parent`
  - `care_team.approved_by_admin`
  - `care_team.revoked`

### `invites`

- atores: `parent_guardian`, `admin`, `support_admin`
- operações:
  - `POST /api/invites`
  - `GET /api/invites`
  - `POST /api/invites/:id/accept`
- objetos mínimos:
  - request: `inviteType`, `targetEmail`, `minorProfileId`
  - response: `inviteId`, `status`
- auditoria:
  - `invite.created`
  - `invite.accepted`
  - `invite.expired`

### `parent-approvals`

- atores: `parent_guardian`
- operações:
  - `POST /api/parent-approvals`
  - `PATCH /api/parent-approvals/:id`
- objetos mínimos:
  - request: `approvalType`, `targetId`, `decision`
  - response: `status`, `effectivePolicy`
- auditoria:
  - `parent_approval.granted`
  - `parent_approval.revoked`

### `legal`

- atores: todos os autenticáveis e leitura pública controlada
- operações:
  - `GET /api/legal/documents`
  - `GET /api/legal/documents/:key`
- objetos mínimos:
  - response: `documentKey`, `version`, `audience`, `status`
- auditoria:
  - `legal.documents_viewed`

### `consents`

- atores: `parent_guardian`, `therapist`, `admin`, `support_admin`
- operações:
  - `POST /api/consents`
  - `GET /api/consents`
  - `POST /api/consents/:id/revoke`
- objetos mínimos:
  - request: `documentKey`, `version`, `accepted`, `audience`
  - response: `ConsentVersion`, `acceptedAt`, `revokedAt`
- auditoria:
  - `consent.accepted`
  - `consent.revoked`

### `policy-versions`

- atores: `admin`, `support_admin`
- operações:
  - `GET /api/policy-versions`
  - `POST /api/policy-versions`
  - `PATCH /api/policy-versions/:id`
- objetos mínimos:
  - request: `policyKey`, `version`, `status`
  - response: `policyVersion`
- auditoria:
  - `policy_version.created`
  - `policy_version.published`

### `profiles`

- atores: todos os autenticáveis com escopo próprio
- operações:
  - `GET /api/profiles/me`
  - `PATCH /api/profiles/me`
- objetos mínimos:
  - response: `profile`, `actorRole`, `ageBand`, `preferences`
- auditoria:
  - `profile.viewed`
  - `profile.updated`

### `children`

- atores: `parent_guardian`, `admin`, `support_admin`
- operações:
  - `POST /api/children`
  - `GET /api/children`
  - `PATCH /api/children/:id`
- objetos mínimos:
  - request: `displayName`, `birthDate`, `preferences`
  - response: `childProfile`, `GuardianLink`
- auditoria:
  - `child.created`
  - `child.updated`

### `adolescents`

- atores: `parent_guardian`, `admin`, `support_admin`
- operações:
  - `POST /api/adolescents`
  - `GET /api/adolescents`
  - `PATCH /api/adolescents/:id`
- objetos mínimos:
  - request: `displayName`, `birthDate`, `preferences`
  - response: `adolescentProfile`, `GuardianLink`
- auditoria:
  - `adolescent.created`
  - `adolescent.updated`

### `moderation`

- atores: `admin`, `support_admin`
- operações:
  - `GET /api/moderation/cases`
  - `PATCH /api/moderation/cases/:id`
- objetos mínimos:
  - response: `ModerationCase[]`
- auditoria:
  - `moderation_case.viewed`
  - `moderation_case.updated`

### `audit`

- atores: `admin`, `support_admin`
- operações:
  - `GET /api/audit/events`
- objetos mínimos:
  - response: `AuditEvent[]`
- auditoria:
  - `audit_events.viewed`

### `incidents`

- atores: `admin`, `support_admin`
- operações:
  - `POST /api/incidents`
  - `GET /api/incidents`
  - `PATCH /api/incidents/:id`
- objetos mínimos:
  - request: `severity`, `sourceType`, `summary`
  - response: `incident`
- auditoria:
  - `incident.created`
  - `incident.updated`

### `rooms`

- atores: `child`, `adolescent`, `parent_guardian`, `therapist`, `admin`, `support_admin`
- operações:
  - `GET /api/rooms`
  - `POST /api/rooms/:id/join`
  - `POST /api/rooms/:id/leave`
- objetos mínimos:
  - response: `room`, `RoomPermission`, `InteractionPolicy`
- auditoria:
  - `room.listed`
  - `room.join_attempted`
  - `room.joined`
  - `room.denied`

### `presence`

- atores: mesmos permitidos em `rooms`
- operações:
  - `POST /api/presence/heartbeat`
  - `GET /api/presence/:roomId`
- objetos mínimos:
  - request: `roomId`, `deviceId`
  - response: `presenceState`
- auditoria:
  - `presence.updated`

### `interaction-policies`

- atores: `parent_guardian`, `admin`, `support_admin`
- operações:
  - `GET /api/interaction-policies/:minorProfileId`
  - `PATCH /api/interaction-policies/:minorProfileId`
- objetos mínimos:
  - response: `InteractionPolicy`
- auditoria:
  - `interaction_policy.viewed`
  - `interaction_policy.updated`

### `media-verification`

- atores: `parent_guardian`, `therapist`, `admin`, `support_admin`
- operações:
  - `POST /api/media-verification`
  - `GET /api/media-verification/:id`
- objetos mínimos:
  - request: `jobType`, `deviceProcessingMode`, `evidenceReference`
  - response: `MediaVerificationJob`
- auditoria:
  - `media_verification.created`
  - `media_verification.reviewed`

### `billing`, `plans`, `subscriptions`, `webhooks`

- atores:
  - `billing`, `plans`, `subscriptions`: `admin`, `support_admin`
  - `webhooks`: sistemas externos autenticados
- operações:
  - `GET /api/billing/overview`
  - `GET /api/plans`
  - `POST /api/plans`
  - `GET /api/subscriptions`
  - `POST /api/webhooks/:provider`
- objetos mínimos:
  - response: provider, plan, subscription, webhook event
- auditoria:
  - `billing.viewed`
  - `plan.created`
  - `subscription.updated`
  - `webhook.received`

## Saída da Fase A

- este documento deve ser usado como fonte para scaffolding da Fase B
- qualquer mudança futura em namespace, papel, status ou entidade deve atualizar:
  - `docs/actor-matrix.md`
  - `docs/compliance-rulebook.md`
  - `docs/authorization-matrix.md`
  - `docs/phase-b-module-map.md`
