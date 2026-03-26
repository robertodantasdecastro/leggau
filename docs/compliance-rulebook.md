# Rulebook de Compliance e Segurança

## Escopo

Este documento define o baseline de compliance e segurança para o Leggau em:

- LGPD
- proteção infantojuvenil no ambiente digital
- auditoria e moderação
- segurança operacional e de credenciais

## Regras obrigatórias

### Identidade e consentimento

- todo ator autenticável precisa de trilha de criação, aceite e sessão
- menores só entram em fluxo completo com vínculo ativo a um responsável
- consentimentos devem ser versionados, auditáveis e revogáveis conforme política
- fluxos de terapeuta exigem aprovação e vínculo explícitos

### Dados e armazenamento

- Postgres como sistema central de registro
- arquivos e evidências fora do código-fonte, em storage segregado
- segregação entre dados de produto, mídia, auditoria e billing
- retenção e descarte controlados por política versionada

### Retenção mínima por classe de dado

- `consentimentos e policy versions`: reter enquanto houver obrigação legal ou relação ativa
- `audit_events`: reter como trilha primária de segurança e operação
- `moderation_cases` e `incidents`: reter até encerramento e janela de revisão definida por política
- `mídia documental`: manter pelo menor tempo operacional possível, sempre fora do código-fonte
- `billing`: reter conforme obrigação fiscal e contratual

### Segurança de aplicação

- criptografia em trânsito em todas as superfícies
- segredo e credenciais fora do repositório
- RBAC/ABAC para todos os atores administrativos e clínicos
- logging seguro, sem vazamento de segredos
- testes de segurança a cada fluxo crítico

### Moderação e IA

- IA nunca atua sem política definida
- IA moderadora funciona como camada de classificação, alerta e bloqueio preventivo
- revisão humana obrigatória para incidentes relevantes
- toda decisão automática sensível deve ser auditável
- IA não pode liberar interação sensível por conta própria
- IA pode:
  - classificar
  - sinalizar
  - bloquear preventivamente
  - abrir `ModerationCase`

### Interações e salas

- sem chat ou social livre entre menores por padrão
- presença, convites e mensagens dependem de:
  - faixa etária
  - autorização do responsável
  - política da sala
  - moderação ativa

## Prioridade de processamento

- OCR, classificação leve, preferências visuais e lógica não sensível devem priorizar execução no dispositivo
- backend recebe somente o mínimo necessário para persistência, auditoria, validação e moderação
- capabilities de biometria ficam desativadas por padrão e protegidas por feature flag, policy e revisão legal

## Auditoria obrigatória

Toda operação sensível deve emitir pelo menos:

- `eventType`
- `actorRole`
- `actorUserId`
- `resourceType`
- `resourceId`
- `outcome`
- `severity`
- `occurredAt`

## Incidentes e severidade

- `low`: anomalia de fluxo ou política sem impacto imediato
- `medium`: violação potencial com necessidade de revisão
- `high`: risco relevante para menor, dado sensível ou operação clínica
- `critical`: evento que exige bloqueio imediato, revisão humana prioritária e trilha reforçada

## Precedência de política

- lei e política publicada
- aprovação do responsável
- vínculo clínico válido
- feature flag técnica
- preferência visual do usuário

## Stack de avaliação open source

### OCR e captura documental

- `Tesseract OCR`
- `OpenCV`
- `PaddleOCR`

### Armazenamento e objetos

- `MinIO` para storage compatível com operação Linux/Ubuntu

### Segurança operacional

- `Nginx`
- `Postgres`
- `Redis`
- trilhas de auditoria no backend NestJS

## Gates de aceite

- nenhuma feature multiactor entra sem política escrita e teste correspondente
- nenhuma integração social entra sem trilha de moderação
- nenhuma capability documental entra sem storage segregado e auditoria
- nenhuma release de beta entra sem checklist completo de auth, consentimento, vínculo, moderação, billing e admin
