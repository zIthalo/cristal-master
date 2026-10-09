// DDL do modelo enxuto da Aula 03 (espelha database/schema_mvp.sql).
// Cada item é um comando separado e idempotente (IF NOT EXISTS),
// então pode rodar a cada inicialização sem apagar dados.
// Os índices ficam dentro do CREATE TABLE porque o MySQL não aceita
// CREATE INDEX IF NOT EXISTS.

export const SCHEMA_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS produtos (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sku             VARCHAR(50)  NOT NULL,
    nome            VARCHAR(150) NOT NULL,
    unidade_medida  VARCHAR(10)  NOT NULL COMMENT 'ex.: KG, UN, L',
    CONSTRAINT uq_produtos_sku UNIQUE (sku)
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS lotes (
    id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    produto_id        INT UNSIGNED  NOT NULL,
    numero_lote       VARCHAR(50)   NOT NULL COMMENT 'identificador impresso no QR Code',
    posicao           VARCHAR(20)   NOT NULL,
    data_fabricacao   DATE          NOT NULL COMMENT 'define a prioridade FIFO',
    data_validade     DATE          NOT NULL,
    qtd_inicial       DECIMAL(12,3) NOT NULL,
    qtd_atual         DECIMAL(12,3) NOT NULL,
    status            ENUM('disponivel', 'consumido', 'vencido') NOT NULL DEFAULT 'disponivel',
    CONSTRAINT uq_lotes_numero UNIQUE (produto_id, numero_lote),
    CONSTRAINT chk_lotes_qtd CHECK (qtd_atual >= 0 AND qtd_atual <= qtd_inicial),
    CONSTRAINT fk_lotes_produto
      FOREIGN KEY (produto_id) REFERENCES produtos (id)
      ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_lotes_fifo (produto_id, status, data_fabricacao)
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS movimentacoes (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    lote_id     INT UNSIGNED  NOT NULL,
    tipo        ENUM('entrada', 'saida') NOT NULL,
    quantidade  DECIMAL(12,3) NOT NULL,
    status      ENUM('sucesso', 'bloqueado_fifo', 'bloqueado_vencido', 'bloqueado_quantidade')
                NOT NULL DEFAULT 'sucesso',
    observacao  VARCHAR(255) NULL,
    criado_em   DATETIME NOT NULL,
    CONSTRAINT chk_mov_quantidade CHECK (quantidade > 0),
    CONSTRAINT fk_mov_lote
      FOREIGN KEY (lote_id) REFERENCES lotes (id)
      ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_mov_status_data (status, criado_em)
  ) ENGINE=InnoDB`,
];
