# Matriz de Atores do Leggau

## Atores

| Papel | Superfície principal | Pode autenticar | Pode gerir perfis infantis | Pode interagir clinicamente | Pode operar billing/admin |
| --- | --- | --- | --- | --- | --- |
| `child` | Unity | Sim, sob vínculo | Não | Não diretamente | Não |
| `adolescent` | Unity | Sim, sob vínculo | Não | Não diretamente | Não |
| `parent_guardian` | Web/PWA | Sim | Sim | Sim, sob política | Não |
| `therapist` | Web/PWA | Sim | Não | Sim | Não |
| `admin` | Web admin | Sim | Sim, operacionalmente | Sim, operacionalmente | Sim |
| `support_admin` | Web admin | Sim | Limitado | Limitado | Limitado |

## Regras de vínculo

- `child` e `adolescent` exigem um `GuardianLink` válido antes da ativação completa.
- `therapist` só acessa dados e ações clínicas após `CareTeamMembership` válido.
- `parent_guardian` pode aprovar, revogar ou limitar vínculos clínicos e sociais conforme política.
- `admin` e `support_admin` operam sob RBAC e trilha de auditoria obrigatória.

## Supervisionamento

- menores não iniciam interação social livre sem autorização
- pais controlam faixa etária, personalização permitida e interações liberadas
- terapeutas recebem apenas as permissões aprovadas para aquele vínculo
- toda interação sensível gera evento auditável

## Políticas mínimas por ator

### `child` e `adolescent`

- home, atividades, recompensas, progresso, Gau e salas apenas quando liberados
- sem edição de políticas, billing ou vínculos
- preferências visuais derivadas da idade com override controlado pelos pais

### `parent_guardian`

- onboarding legal
- criação/edição de perfis infantis
- configuração de visual, faixa e permissões
- convites e aprovação de terapeutas
- monitoramento e relatórios

### `therapist`

- onboarding profissional
- gestão de carteira de pacientes vinculados
- acompanhamento, metas e observações
- intervenções só nas áreas liberadas por política

### `admin` e `support_admin`

- auditoria
- moderação
- incidentes
- billing
- operação e suporte
