# Checklist de Migracao para EC2

- Criar instancia Ubuntu dedicada
- Configurar alias SSH `leggau`
- Repetir topologia `docker compose`
- Ajustar DNS e SSL
- Restringir portas com firewall/security group
- Externalizar uploads e backups se necessario
- Adicionar observabilidade, rotacao de logs e monitoração
- Decidir entre manter Postgres na mesma VM ou migrar para servico gerenciado
