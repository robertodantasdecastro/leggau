# Leggau

Monorepo do Leggau para uma plataforma multiactor com:

- `mobile/`: app Unity para `child` e `adolescent`
- `backend/`: API NestJS com Postgres e Redis
- `web/portal`: portal institucional e futura entrada web/PWA
- `web/admin`: web admin tecnico-operacional, compliance e billing
- `infra/`: Docker Compose, Nginx, systemd e scripts operacionais
- `docs/`: arquitetura, compliance, backlog, setup da `vm2` e checklist da EC2

## Comecando rapido

1. Copie o arquivo de ambiente:

```bash
cp .env.example .env
```

2. Suba a stack local:

```bash
docker compose up --build
```

Ou rode apenas a API sem containers, usando banco em memoria:

```bash
cd backend
npm run start:local
```

3. Endpoints principais:

- API root local de fallback: `http://localhost:8080/api`
- API de desenvolvimento oficial na VM: `http://10.211.55.22:8080/api`
- Portal local via gateway: `http://localhost:8080/`
- Admin local via gateway: `http://localhost:8080/admin/`
- Health: `http://localhost:8080/api/health`
- Activities: `http://localhost:8080/api/activities`

## Estrutura

```text
.
|-- backend
|-- .codex
|-- .data
|-- docs
|-- infra
|-- mobile
|-- web
`-- scripts
```

## Documentos canônicos de plataforma

- Blueprint multiactor: [docs/platform-blueprint.md](/Volumes/SSDExterno/Desenvolvimento/Leggau/docs/platform-blueprint.md)
- Matriz de atores: [docs/actor-matrix.md](/Volumes/SSDExterno/Desenvolvimento/Leggau/docs/actor-matrix.md)
- Rulebook de compliance: [docs/compliance-rulebook.md](/Volumes/SSDExterno/Desenvolvimento/Leggau/docs/compliance-rulebook.md)
- Backlog executável da plataforma: [docs/platform-backlog.md](/Volumes/SSDExterno/Desenvolvimento/Leggau/docs/platform-backlog.md)
- Contratos multiactor: [docs/platform-contracts.md](/Volumes/SSDExterno/Desenvolvimento/Leggau/docs/platform-contracts.md)
- Autorização por namespace: [docs/authorization-matrix.md](/Volumes/SSDExterno/Desenvolvimento/Leggau/docs/authorization-matrix.md)
- Feature flags do beta: [docs/beta-feature-flags.md](/Volumes/SSDExterno/Desenvolvimento/Leggau/docs/beta-feature-flags.md)
- Mapa de módulos da Fase B: [docs/phase-b-module-map.md](/Volumes/SSDExterno/Desenvolvimento/Leggau/docs/phase-b-module-map.md)
- Timeline de entrega: [docs/mvp-timeline.md](/Volumes/SSDExterno/Desenvolvimento/Leggau/docs/mvp-timeline.md)

## Observacoes

- Arquivos grandes do projeto devem ficar no SSD externo em `/Volumes/SSDExterno/Desenvolvimento/Leggau`.
- A stack Docker local foi configurada para usar bind mounts em `./.data/`, evitando deixar Postgres, Redis, uploads e backups no disco interno.
- O gateway Nginx agora publica `portal`, `admin` e `api` a partir do mesmo stack local.
- Builds mobile, cache local do Unity e artefatos 3D/Blender devem usar as raizes definidas em `.env`.
- O backend oficial de desenvolvimento continua em `vm2` em `http://10.211.55.22:8080/api`.
- O mobile infantil/adolescente continua no Unity; superfícies adultas passam a ser `web responsiva/PWA`.
- O portal e o admin devem usar aliases temporarios `trycloudflare.com` em dev na `vm2`, com dominio final em producao:
  - `www.leggau.com`
  - `admin.leggau.com`
  - `api.leggau.com`
- O alias `leggau` para a futura EC2 ainda nao esta configurado nesta maquina.
