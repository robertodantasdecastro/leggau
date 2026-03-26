# Feature Flags e Fronteiras do Beta

## Objetivo

Congelar os recursos sensíveis do beta fechado atrás de flags explícitas e defaults conservadores.

## Tabela de flags

| Flag | Default | Escopo | Regra |
| --- | --- | --- | --- |
| `biometric_verification` | `off` | verificação avançada | só pode ser ativada com revisão legal e política publicada |
| `document_ocr_capture` | `off` | captura documental | exige storage segregado, auditoria e device-first |
| `therapist_linking` | `on` | vínculo clínico | só ativa com aprovação administrativa no beta |
| `rooms_enabled` | `on` | salas estruturadas | sem chat livre; depende de política e vínculo |
| `presence_enabled` | `on` | presença e heartbeat | só com autorização e trilha auditável |
| `minor_social_messaging` | `off` | mensagens entre menores | proibido nesta fase |
| `ai_moderation_blocking` | `on` | bloqueio preventivo | IA pode bloquear preventivamente e abrir caso |

## Defaults congelados da Fase A

- `minor_social_messaging = off`
- `rooms_enabled = on`
- `presence_enabled = on`
- `therapist_linking = on`
- `biometric_verification = off`
- `document_ocr_capture = off`
- `ai_moderation_blocking = on`

## Fronteiras do beta

### Permitido

- onboarding de responsáveis com consentimento
- criação e gestão de perfis `child` e `adolescent`
- vínculo clínico com terapeuta aprovado por admin
- salas estruturadas sob política
- presença auditável
- bloqueio preventivo por IA moderadora com revisão humana posterior

### Não permitido

- chat livre entre menores
- comunicação social aberta sem política
- biometria por padrão
- upload documental sem storage segregado e trilha auditável
- liberação clínica automática sem aprovação administrativa

## Regra de precedência

- lei e política publicada
- aprovação do responsável
- vínculo clínico válido
- flag técnica
- preferência visual do usuário

## Gatilhos de ativação futura

- `document_ocr_capture` só sai de `off` quando houver pipeline device-first + storage segregado + auditoria
- `minor_social_messaging` só pode sair de `off` após fase de moderação, política e autorização legal
- `biometric_verification` só pode ser considerada após revisão jurídica e privacy review
