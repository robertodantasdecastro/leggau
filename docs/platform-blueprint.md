# Blueprint da Plataforma Leggau

## Objetivo

Transformar o Leggau em uma plataforma multiactor pronta para beta fechado com:

- app Unity para `child` e `adolescent`
- experiência `web responsiva/PWA` para `parent_guardian` e `therapist`
- `web admin` para operação, compliance, billing e suporte
- backend único em `vm2` no desenvolvimento e `EC2` na produção

## Superfícies

### App Unity infantil/adolescente

- onboarding dependente de vínculo prévio com responsável
- home gamificada persistente por perfil
- Gau, atividades, recompensas e progresso
- personalização automática por faixa etária com override controlado pelos pais
- ambientes 3D e interações apenas quando a política do perfil permitir

### Web/PWA adulta

- shell `parent`
- shell `therapist`
- login, consentimentos e gestão de vínculos
- relatórios, permissões, acompanhamento e convites
- responsivo para desktop e mobile, sem segundo app nativo nesta fase

### Web admin

- gestão de atores, vínculos e políticas
- dashboards operacionais, clínico-operacionais e financeiros
- auditoria, moderação, billing e suporte

## Papéis canônicos

- `child`
- `adolescent`
- `parent_guardian`
- `therapist`
- `admin`
- `support_admin`

## Faixas etárias automáticas

- `6-9`
- `10-12`
- `13-17`

## Domínios principais

- `identity`: auth, reset, sessions, devices
- `guardianship`: vínculo responsável-filho
- `care-team`: vínculo terapeuta-família/criança
- `legal`: consentimentos, policy versions, retenção, auditoria
- `experience`: atividades, progresso, recompensas, Gau, variações etárias
- `interaction`: salas, presença, convites, permissões de comunicação
- `moderation`: eventos, alertas, incidentes, revisão humana
- `media-verification`: OCR, captura documental e jobs de validação
- `billing`: planos, assinaturas, hubs, transações e webhooks

## Princípios de arquitetura

- backend único e centralizado em `vm2`/`EC2`
- processamento local-first em dispositivos sempre que seguro e viável
- nenhuma interação social livre entre menores sem política explícita
- todas as ações sensíveis devem gerar trilha auditável
- IA atua como camada de política, moderação e assistência, nunca como agente autônomo irrestrito
- dados sensíveis segregados entre Postgres, storage de arquivos e trilhas de auditoria

## Contratos e entidades a introduzir

### Entidades

- `GuardianLink`
- `CareTeamMembership`
- `InteractionPolicy`
- `ConsentVersion`
- `AuditEvent`
- `ModerationCase`
- `RoomPermission`
- `DeviceSession`
- `MediaVerificationJob`

### Namespaces de API

- `/api/auth`
- `/api/password-reset`
- `/api/sessions`
- `/api/devices`
- `/api/guardianship`
- `/api/care-team`
- `/api/legal`
- `/api/consents`
- `/api/policy-versions`
- `/api/profiles`
- `/api/children`
- `/api/adolescents`
- `/api/therapist-clients`
- `/api/parent-approvals`
- `/api/invites`
- `/api/moderation`
- `/api/audit`
- `/api/incidents`
- `/api/rooms`
- `/api/presence`
- `/api/interaction-policies`
- `/api/media-verification`
- `/api/billing`
- `/api/plans`
- `/api/subscriptions`
- `/api/webhooks`

## Sequência executável

### Fase A

- congelar matriz de atores, permissões e fluxos
- escrever rulebook legal e operacional
- fechar limites da IA moderadora
- traduzir tudo em backlog executável
- produzir contratos, flags e mapa de módulos para a Fase B

### Fase B

- identidade, vínculos e segurança-base

### Fase C

- superfícies web/PWA de pais e terapeutas

### Fase D

- shell infantil/adolescente no Unity

### Fase E

- salas, presença, moderação e interação monitorada

### Fase F

- billing completo, readiness operacional e beta fechado
