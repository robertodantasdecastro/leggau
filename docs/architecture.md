# Arquitetura Inicial

## Camadas

- `mobile/`: cliente Unity para Android/iOS com cenas 3D e overlays 2D
- `backend/`: API NestJS para autenticacao, familia, atividades, progresso, recompensas e catalogo de assets
- `postgres`: persistencia principal
- `redis`: cache leve e base para futuras filas/sessoes
- `nginx`: reverse proxy e entrega de uploads

## Fluxo principal

1. O app Unity autentica com `POST /api/auth/dev-login`.
2. O app busca perfil, familia, atividades e catalogo de assets.
3. Ao concluir uma atividade, envia `POST /api/progress/checkins`.
4. A API registra o evento, soma pontos e libera recompensas.

## Dados persistidos

- `parent_profiles`
- `child_profiles`
- `activities`
- `rewards`
- `progress_entries`

## Convencoes

- `DEV_API_BASE_URL` aponta para a stack da `vm2` ou para o gateway local.
- Uploads ficam fora do codigo-fonte e sao servidos por `/uploads/`.
- Arquivos pesados de desenvolvimento devem permanecer no SSD externo, dentro de `/Volumes/SSDExterno/Desenvolvimento/Leggau/.data/`.
- Postgres e Redis locais usam bind mounts em `./.data/docker/` para evitar consumo do disco interno.
- Builds mobile, cache local do Unity e artefatos do Blender devem usar diretorios dentro de `./.data/`.
- A EC2 de producao deve replicar essa topologia antes de endurecer a operacao.
