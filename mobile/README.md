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
- `Assets/Editor`: scripts para gerar a cena bootstrap
- `Assets/Art/Characters/Gau`: fonte `.blend` e export `.fbx` do mascote
- `Assets/Art/Characters/Gau/PixelArt`: copia em pixel art do Gau
- `Assets/Art/Characters/Gau/PixelTextured`: copia 3D com textura pixel art, atlas e preview
- `Assets/Art/Characters/Gau/RobloxPixel`: variante 3D blocada, tipo Roblox, com atlas, blend, fbx e preview
- `Assets/Art/Characters/Gau/RoundedPixel`: variante 3D com cantos mais arredondados e textura pixel art mais detalhada
- `Assets/Art/Characters/Gau/MarioPixel`: variante 3D retro com granulação de pixels mais densa por parte do corpo
- `Assets/StreamingAssets/config`: ambientes do app
- `Assets/StreamingAssets/config/gau-variants.json`: catalogo local das variantes do Gau para o app

## Abrindo no Unity

1. Instale uma versao LTS recente do Unity com suporte Android/iOS
2. Abra a pasta `mobile/`
3. Deixe o Unity gerar `.meta`, `Library/` e os projetos locais

## Ambientes

- `StreamingAssets/config/dev-api.json`
- `StreamingAssets/config/prod-api.json`

## Backend de desenvolvimento

- principal: `http://10.211.55.22:8080/api`
- fallback local: `http://localhost:8080/api`

## Primeiro fluxo funcional

- Carregar configuracao de ambiente
- Executar `dev-login`
- Buscar familia, atividades, progresso, recompensas e catalogo de assets
- Renderizar um dashboard textual inicial dentro da cena Unity
- Exibir o Gau 3D importado do Blender
- Permitir variantes de arte do Gau, incluindo a copia 3D com textura pixel art
- Permitir variantes de arte do Gau, incluindo a copia blocada tipo Roblox para testes de estilo
- Permitir variantes de arte do Gau, incluindo a copia arredondada com mais leitura de pixels
- Permitir variantes de arte do Gau, incluindo a copia retro com granulação mais alta por corpo e membros
- Exibir no bootstrap quais variantes locais do Gau ja estao prontas para consumo no mobile
- Permitir navegar entre as variantes locais do Gau ainda dentro do bootstrap
- Trocar a visualizacao do mascote em runtime conforme a variante selecionada
