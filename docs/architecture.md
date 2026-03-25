# Arquitetura Inicial

## Camadas

- `mobile/`: cliente Unity para Android/iOS com cenas 3D e overlays 2D
- `backend/`: API NestJS para autenticacao, familia, atividades, progresso, recompensas, legal, admin e billing sandbox
- `web/portal`: portal institucional, legal e de distribuicao
- `web/admin`: web admin tecnico-operacional e comercial
- `postgres`: persistencia principal
- `redis`: cache leve e base para futuras filas/sessoes
- `nginx`: reverse proxy e entrega de portal, admin, API e uploads

## Fluxo principal

1. O app Unity autentica com `POST /api/auth/login` ou usa `dev-login` em ambiente tecnico.
2. O app busca perfil, familia, atividades e catalogo de assets.
3. Ao concluir uma atividade, envia `POST /api/progress/checkins`.
4. A API registra o evento, soma pontos e libera recompensas.
5. O portal publica narrativa, download, termos e privacidade.
6. O web admin consome `admin/*` para operacao, usuarios, recursos da VM e billing sandbox.

## Dados persistidos

- `parent_profiles`
- `app_users`
- `admin_users`
- `child_profiles`
- `activities`
- `rewards`
- `progress_entries`
- `legal_documents`
- `consent_records`
- `billing_providers`
- `billing_plans`
- `billing_transactions`

## Convencoes

- `DEV_API_BASE_URL` aponta para `http://10.211.55.22:8080/api`.
- `DEV_PORTAL_ALIAS_URL` e `DEV_ADMIN_ALIAS_URL` representam aliases temporarios `trycloudflare.com` para a `vm2`.
- O frontend mobile deve usar localhost apenas como fallback quando a `vm2` estiver indisponivel.
- O portal local responde em `/` e o admin local responde em `/admin/` via Nginx.
- Uploads ficam fora do codigo-fonte e sao servidos por `/uploads/`.
- Arquivos pesados de desenvolvimento devem permanecer no SSD externo, dentro de `/Volumes/SSDExterno/Desenvolvimento/Leggau/.data/`.
- Postgres e Redis locais usam bind mounts em `./.data/docker/` para evitar consumo do disco interno.
- O runtime de aliases Cloudflare dev deve persistir em `./.data/runtime/cloudflare/`.
- Builds mobile, cache local do Unity e artefatos do Blender devem usar diretorios dentro de `./.data/`.
- A EC2 de producao deve replicar essa topologia antes de endurecer a operacao.
