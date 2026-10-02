-- ============================================================
-- Cristal Master — Modelo de Dados Enxuto (MVP / Aula 03)
-- 3 tabelas, conforme orientação da disciplina: nada de banco
-- corporativo gigante. Foco no essencial para o FIFO funcionar
-- e para alimentar o script de mock de dados industriais.
-- ============================================================

CREATE DATABASE IF NOT EXISTS cristal_master
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cristal_master;

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- 1. PRODUTOS
-- ------------------------------------------------------------
CREATE TABLE produtos (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sku             VARCHAR(50) NOT NULL,
  nome            VARCHAR(150) NOT NULL,
  unidade_medida  VARCHAR(10) NOT NULL COMMENT 'ex.: KG, UN, L',

  CONSTRAINT uq_produtos_sku UNIQUE (sku)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 2. LOTES
-- ------------------------------------------------------------
-- posicao é o endereço lógico no piso (ex.: "F01"), sinalizado por
-- fita/pintura, sem custo de infraestrutura — é o que conecta a
-- regra FIFO lógica (data_fabricacao) à realidade física do chão
-- de fábrica.
CREATE TABLE lotes (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  produto_id        INT UNSIGNED NOT NULL,
  numero_lote       VARCHAR(50) NOT NULL COMMENT 'identificador físico impresso no QR Code',
  posicao           VARCHAR(20) NOT NULL,
  data_fabricacao   DATE NOT NULL COMMENT 'define a prioridade FIFO',
  data_validade     DATE NOT NULL,
  qtd_inicial       DECIMAL(12,3) NOT NULL,
  qtd_atual         DECIMAL(12,3) NOT NULL,
  status            ENUM('disponivel', 'consumido', 'vencido') NOT NULL DEFAULT 'disponivel',

  CONSTRAINT uq_lotes_numero UNIQUE (produto_id, numero_lote),
  CONSTRAINT chk_lotes_qtd CHECK (qtd_atual >= 0 AND qtd_atual <= qtd_inicial),

  CONSTRAINT fk_lotes_produto
    FOREIGN KEY (produto_id) REFERENCES produtos (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Consulta mais frequente do sistema: "qual o lote mais antigo
-- disponível para este produto?"
CREATE INDEX idx_lotes_fifo ON lotes (produto_id, status, data_fabricacao);

-- ------------------------------------------------------------
-- 3. MOVIMENTACOES
-- ------------------------------------------------------------
-- Registra toda tentativa de saída, inclusive as bloqueadas —
-- é o que torna possível detectar e demonstrar anomalias no mock.
CREATE TABLE movimentacoes (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lote_id       INT UNSIGNED NOT NULL,
  tipo          ENUM('entrada', 'saida') NOT NULL,
  quantidade    DECIMAL(12,3) NOT NULL,
  status        ENUM('sucesso', 'bloqueado_fifo', 'bloqueado_vencido', 'bloqueado_quantidade')
                NOT NULL DEFAULT 'sucesso',
  observacao    VARCHAR(255) NULL,
  criado_em     DATETIME NOT NULL,

  CONSTRAINT chk_mov_quantidade CHECK (quantidade > 0),

  CONSTRAINT fk_mov_lote
    FOREIGN KEY (lote_id) REFERENCES lotes (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_mov_status_data ON movimentacoes (status, criado_em);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Consulta central da regra FIFO:
-- SELECT id, numero_lote, posicao, data_fabricacao
-- FROM lotes
-- WHERE produto_id = :produto_id AND status = 'disponivel'
-- ORDER BY data_fabricacao ASC
-- LIMIT 1;
-- ============================================================
