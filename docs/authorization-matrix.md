# Matriz de Autorização por Namespace

## Objetivo

Definir quem pode ler, criar, aprovar, revogar e operar cada namespace da plataforma.

## Regra global de precedência

- lei e política publicada
- aprovação do responsável
- vínculo clínico válido
- feature flag técnica
- preferência visual do usuário

## Autorização por namespace

| Namespace | Atores autorizados | Escopo permitido | Evento auditável obrigatório |
| --- | --- | --- | --- |
| `auth` | todos os autenticáveis | criar sessão, renovar, encerrar | `auth.logged_in` |
| `password-reset` | `parent_guardian`, `therapist`, `admin`, `support_admin` | solicitar e confirmar reset | `auth.password_reset_completed` |
| `sessions` | todos os autenticáveis | listar e revogar próprias sessões; admins podem investigar | `session.revoked` |
| `devices` | todos os autenticáveis | registrar e atualizar dispositivo próprio | `device.registered` |
| `guardianship` | `parent_guardian`, `admin`, `support_admin` | criar, ativar, revogar vínculo infantojuvenil | `guardianship.updated` |
| `care-team` | `therapist`, `parent_guardian`, `admin`, `support_admin` | solicitar, aprovar e revogar vínculo clínico | `care_team.approved_by_admin` |
| `invites` | `parent_guardian`, `admin`, `support_admin` | convidar terapeuta ou colaborador autorizado | `invite.created` |
| `parent-approvals` | `parent_guardian` | conceder ou revogar permissões sobre menores | `parent_approval.granted` |
| `legal` | leitura controlada para atores autenticáveis; publicação por admin | consultar documentos e versões | `legal.documents_viewed` |
| `consents` | `parent_guardian`, `therapist`, `admin`, `support_admin` | aceitar e revogar consentimentos aplicáveis | `consent.accepted` |
| `policy-versions` | `admin`, `support_admin` | publicar política e versionamento | `policy_version.published` |
| `profiles` | todos os autenticáveis | operar perfil próprio dentro do papel | `profile.updated` |
| `children` | `parent_guardian`, `admin`, `support_admin` | criar, editar e ativar perfil infantil | `child.created` |
| `adolescents` | `parent_guardian`, `admin`, `support_admin` | criar, editar e ativar perfil adolescente | `adolescent.created` |
| `moderation` | `admin`, `support_admin` | triagem, bloqueio e revisão humana | `moderation_case.updated` |
| `audit` | `admin`, `support_admin` | consulta de eventos e trilhas | `audit_events.viewed` |
| `incidents` | `admin`, `support_admin` | criar, classificar e resolver incidente | `incident.updated` |
| `rooms` | atores com política ativa e permissão válida | entrar, sair e visualizar salas estruturadas | `room.join_attempted` |
| `presence` | atores com `RoomPermission` ativa | presença e heartbeat em sala | `presence.updated` |
| `interaction-policies` | `parent_guardian`, `admin`, `support_admin` | ver e alterar política efetiva de interação | `interaction_policy.updated` |
| `media-verification` | `parent_guardian`, `therapist`, `admin`, `support_admin` | iniciar e acompanhar validação documental | `media_verification.created` |
| `billing` | `admin`, `support_admin` | visão financeira e operacional | `billing.viewed` |
| `plans` | `admin`, `support_admin` | criar, editar e publicar planos | `plan.created` |
| `subscriptions` | `admin`, `support_admin` | acompanhar e ajustar assinaturas | `subscription.updated` |
| `webhooks` | provedores externos autenticados + admin para observação | entrada de eventos financeiros | `webhook.received` |

## Regras especiais

### Menores

- `child` e `adolescent` só acessam `rooms` e `presence` quando houver:
  - `GuardianLink` ativo
  - `InteractionPolicy` válida
  - flag do recurso habilitada
- `child` e `adolescent` não operam `consents`, `billing`, `plans`, `subscriptions`, `audit` ou `admin`

### Terapeutas

- `therapist` só opera escopo clínico após:
  - vínculo `CareTeamMembership` ativo
  - aprovação administrativa no beta
- terapeuta não altera política global, billing ou administração operacional

### Admins

- `admin` e `support_admin` sempre operam com RBAC/ABAC e trilha auditável
- `support_admin` recebe escopo restrito por política operacional

## Gates de aceitação

- nenhum namespace entra em implementação sem ator autorizado e evento auditável definidos
- nenhuma permissão de menor entra sem dependência explícita de vínculo e política
- qualquer exceção operacional deve passar por admin e gerar `AuditEvent`
