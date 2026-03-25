# Leggau

Monorepo inicial do Leggau com:

- `mobile/`: base do projeto Unity para Android/iOS
- `backend/`: API NestJS com Postgres e Redis
- `web/portal`: portal institucional, legal e de distribuicao
- `web/admin`: web admin tecnico-operacional e billing sandbox
- `infra/`: Docker Compose, Nginx, systemd e scripts operacionais
- `docs/`: arquitetura, setup da `vm2` e checklist da EC2

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

## Observacoes

- Arquivos grandes do projeto devem ficar no SSD externo em `/Volumes/SSDExterno/Desenvolvimento/Leggau`.
- A stack Docker local foi configurada para usar bind mounts em `./.data/`, evitando deixar Postgres, Redis, uploads e backups no disco interno.
- O gateway Nginx agora publica `portal`, `admin` e `api` a partir do mesmo stack local.
- Builds mobile, cache local do Unity e artefatos 3D/Blender devem usar as raizes definidas em `.env`.
- O mobile deve preferir a VM `10.211.55.22` como backend de desenvolvimento e usar localhost apenas como fallback.
- O portal e o admin devem usar aliases temporarios `trycloudflare.com` em dev na `vm2`, com dominio final em producao:
  - `www.leggau.com`
  - `admin.leggau.com`
  - `api.leggau.com`
- O acesso SSH para `vm2` ainda precisa estar autorizado com a chave correta para executar o deploy remoto automatizado.
- O alias `leggau` para a futura EC2 ainda nao esta configurado nesta maquina.
