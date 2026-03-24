# Leggau

Monorepo inicial do Leggau com:

- `mobile/`: base do projeto Unity para Android/iOS
- `backend/`: API NestJS com Postgres e Redis
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

- API root: `http://localhost:8080/api`
- Health: `http://localhost:8080/api/health`
- Activities: `http://localhost:8080/api/activities`

## Estrutura

```text
.
|-- backend
|-- docs
|-- infra
|-- mobile
`-- scripts
```

## Observacoes

- O acesso SSH para `vm2` ainda precisa estar autorizado com a chave correta para executar o deploy remoto automatizado.
- O alias `leggau` para a futura EC2 ainda nao esta configurado nesta maquina.
- O Unity nao esta instalado nesta estacao, entao a base mobile foi estruturada para abrir no editor e gerar os arquivos derivados quando o Unity for iniciado.
