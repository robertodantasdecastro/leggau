# Mobile Unity

Base do app mobile do Leggau.

## Objetivo

- Compatibilidade com Android e iOS
- Cenas 3D para as atividades gamificadas
- Camadas 2D para HUD, progresso, recompensas e menus

## Estrutura inicial

- `Assets/Scripts/App`: bootstrap da aplicacao e orquestracao inicial
- `Assets/Scripts/Models`: contratos consumidos da API
- `Assets/Scripts/Networking`: cliente HTTP para a API
- `Assets/Scripts/Gameplay`: modelos de progresso e atividades
- `Assets/Scripts/UI`: presenters de HUD e recompensas
- `Assets/StreamingAssets/config`: ambientes do app

## Abrindo no Unity

1. Instale uma versao LTS recente do Unity com suporte Android/iOS
2. Abra a pasta `mobile/`
3. Deixe o Unity gerar `.meta`, `Library/` e os projetos locais

## Ambientes

- `StreamingAssets/config/dev-api.json`
- `StreamingAssets/config/prod-api.json`

## Primeiro fluxo funcional

- Carregar configuracao de ambiente
- Executar `dev-login`
- Buscar familia, atividades e recompensas
- Renderizar um dashboard textual inicial dentro da cena Unity
