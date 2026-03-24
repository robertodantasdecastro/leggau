# Setup da vm2

## Estrutura esperada

```text
~/leggau
|-- .env
|-- docker-compose.yml
|-- backend/
|-- data/
|   |-- uploads/
|   `-- backups/
`-- logs/
```

## Provisionamento

1. Copiar ou clonar o repositorio em `~/leggau`
2. Executar `scripts/bootstrap-vm.sh`
3. Revisar `.env`
4. Subir a stack com `docker compose up -d --build`

## Portas

- `80` no Nginx dentro do container
- `8080` no host para consumo do mobile durante desenvolvimento
- `5432` para Postgres
- `6379` para Redis
- `3000` para API direta, se necessario

## Backups

- Banco: `scripts/backup-vm.sh`
- Uploads: tarball criado no mesmo fluxo
- Destino padrao: `~/leggau/data/backups`
