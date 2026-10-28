# /mock — Simulador de Dados Industriais

Script independente que gera dados de teste para o módulo de almoxarifado/FIFO, simulando operação normal e anomalias industriais.

## Como executar

```bash
# Lote histórico (gera e encerra, mais rápido para testar a aplicação)
node simulator.js --mode=historico --quantidade=2000

# Modo contínuo (gera um evento a cada X ms, útil para demonstração ao vivo)
node simulator.js --mode=live --intervalo=2000

# Também gravar direto no MySQL (schema_mvp.sql já aplicado)
# requer: npm i mysql2  e variáveis de ambiente DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
node simulator.js --mode=historico --quantidade=2000 --mysql
```

## Saída gerada

- `output/seed_produtos.json` — 5 produtos (resinas e aditivos).
- `output/seed_lotes.json` — 20 a 40 lotes, com datas de fabricação/validade realistas; ~8% já nascem vencidos de propósito.
- `output/movimentacoes.ndjson` — um evento de saída por linha (JSON), pronto para ser consumido pela API ou analisado.

## Anomalias simuladas (~10% dos eventos)

| status | significado |
|---|---|
| `bloqueado_fifo` | operador tentou pegar um lote mais novo, pulando o mais antigo disponível |
| `bloqueado_vencido` | tentativa de saída de um lote com validade expirada |
| `bloqueado_quantidade` | quantidade solicitada maior que o saldo do lote |

Os demais ~90% dos eventos são `sucesso`, respeitando a ordem FIFO (lote com `data_fabricacao` mais antiga).
