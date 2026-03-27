# Arquitetura da Plataforma

## Referencias principais

- blueprint: `docs/platform-blueprint.md`
- matriz de atores: `docs/actor-matrix.md`
- rulebook: `docs/compliance-rulebook.md`
- backlog: `docs/platform-backlog.md`
- contratos: `docs/platform-contracts.md`
- autorizacao: `docs/authorization-matrix.md`
- flags do beta: `docs/beta-feature-flags.md`
- mapa da fase B: `docs/phase-b-module-map.md`
- operacao de social auth e verificacao: `docs/social-auth-operations.md`

## Camadas

- `mobile/`: cliente Unity para `child` e `adolescent`
- `backend/`: API NestJS multiactor para identidade, vínculos, legal, moderação, experiência, admin e billing
- `web/portal`: portal institucional e base ativa para shells web/PWA de `parent_guardian` e `therapist`
- `web/admin`: web admin tecnico-operacional, compliance e billing
- `postgres`: persistencia principal
- `redis`: cache leve e futura base de presença/filas; as sessoes canônicas da Fase B agora persistem em Postgres
- `nginx`: reverse proxy e entrega de portal, admin, API e uploads

## Superfícies por ator

- `child` e `adolescent`: Unity
- `parent_guardian`: web responsiva/PWA
- `therapist`: web responsiva/PWA
- `admin` e `support_admin`: web admin

## Fluxo principal revisado

1. O responsável cria conta com senha ou login rápido Google/Apple, aceita consentimentos publicados e só então cria/vincula perfis infantis.
2. O terapeuta entra por fluxo próprio com senha ou login rápido Google/Apple e só acessa dados após vínculo aprovado pelo responsável e pelo admin.
3. A criança/adolescente entra no app Unity apenas com vínculo e política válidos.
4. O app carrega perfil, faixa etária, atividades, progresso, recompensas e Gau.
5. Interações, salas e comunicação dependem de `InteractionPolicy`.
6. Admin opera usuários, provedores de identidade, vínculos, billing, moderação, auditoria, incidentes e jobs de verificação.

## Dados persistidos

- `parent_profiles`
- `therapist_profiles`
- `app_users`
- `admin_users`
- `auth_provider_configs`
- `external_identities`
- `child_profiles`
- `adolescent_profiles`
- `guardian_links`
- `care_team_memberships`
- `parent_approvals`
- `invites`
- `activities`
- `rewards`
- `progress_entries`
- `legal_documents`
- `policy_versions`
- `consent_records`
- `interaction_policies`
- `audit_events`
- `moderation_cases`
- `incidents`
- `device_sessions`
- `media_verification_jobs`
- `billing_providers`
- `billing_plans`
- `billing_transactions`

## Convencoes

- `DEV_API_BASE_URL` aponta para `http://10.211.55.22:8080/api`.
- `DEV_PORTAL_ALIAS_URL` e `DEV_ADMIN_ALIAS_URL` representam aliases temporarios `trycloudflare.com` para a `vm2`.
- O backend de desenvolvimento continua centralizado na `vm2`.
- As superfícies adultas seguem direção `web/PWA-first`.
- O portal local responde em `/` e o admin local responde em `/admin/` via Nginx.
- Uploads ficam fora do codigo-fonte e sao servidos por `/uploads/`.
- Arquivos pesados de desenvolvimento devem permanecer no SSD externo, dentro de `/Volumes/SSDExterno/Desenvolvimento/Leggau/.data/`.
- Postgres e Redis locais usam bind mounts em `./.data/docker/` para evitar consumo do disco interno.
- O runtime de aliases Cloudflare dev deve persistir em `./.data/runtime/cloudflare/`.
- Builds mobile, cache local do Unity e artefatos do Blender devem usar diretorios dentro de `./.data/`.
- Processamento deve priorizar execução no dispositivo quando seguro e viável.
- A EC2 de producao deve replicar essa topologia antes de endurecer a operacao.

## Estado runtime atual

- A Fase B ja roda no backend oficial da `vm2` com migracoes formais em Postgres.
- `GuardianLink` e a fonte de verdade para responsavel-menor.
- `device_sessions` sustenta sessoes opacas persistidas por dispositivo.
- `policy_versions` projeta as policies legais publicadas para os clientes atuais.
- `auth_provider_configs` governa Google e Apple/iCloud com segredos cifrados em repouso via `AUTH_PROVIDER_SECRET_KEY`.
- `external_identities` conecta sujeitos externos do Google/Apple aos atores `parent_guardian` e `therapist`.
- `media_verification_jobs` sustenta simulacoes auditaveis de OCR e biometria para validacao e readiness.
- `web/admin` agora expoe configuracao de provedores e observacao dos jobs de verificacao.
- `web/admin` agora tambem expoe care-team review, audit trail, incidents e moderation como console operacional unificado.
- `web/portal` agora expoe shells iniciais para `parent_guardian` e `therapist`, consumindo provedores publicados, consentimentos, familia, sessoes, convites, permissoes explicitas e `care-team`.
- `invites` agora carregam ownership e alvo por ator, permitindo jornadas rastreaveis de familia para terapeuta sem abrir descoberta livre.
- `parent_approvals` agora funcionam como ledger auditavel do lado do responsavel para OCR, presenca estruturada e vinculacao clinica.
- `progress_entries` foi desacoplado do FK legado de `child_profiles`, permitindo continuidade do modelo multiactor tambem para `adolescent`.
- `web/portal` agora tambem publica `manifest.webmanifest` e `sw.js`, fechando o shell adulto online-first em formato PWA instalavel.
- O runtime Unity agora entra por sessao do responsavel, leitura de `families/overview`, selecao do menor vinculado e consumo de `interaction-policies/:minorProfileId`.
- O Unity agora resolve e persiste `SelectedMinor`, `ResolvedAgeBand` e `ActiveShell`, mantendo `ActiveChild` apenas como projecao de compatibilidade.
- A apresentacao do Unity agora diferencia `6-9`, `10-12` e `13-17`, separando shells explicitos de `child` e `adolescent` dentro da mesma `Bootstrap.unity`.
- `InteractionPolicy` agora governa visibilidade e bloqueio de salas, presenca, mensageria e participacao clinica diretamente no shell do menor.
- A primeira fatia da Fase E agora esta ativa:
  - `GET /api/rooms`, `POST /api/rooms/:id/join`, `POST /api/rooms/:id/leave`, `POST /api/presence/heartbeat` e `GET /api/presence/:roomId`
  - acesso a `rooms/presence` depende de `GuardianLink` ativo ou `CareTeamMembership` ativo e aprovado
  - no runtime atual, presenca monitorada continua efemera em memoria do processo da API, adequada para validacao e evolucao do produto nesta fase
