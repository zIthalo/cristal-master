#!/usr/bin/env node
/**
 * Cristal Master — Simulador de Dados Industriais (Mock)
 * -------------------------------------------------------
 * Gera produtos e lotes (seed) e, em seguida, eventos de saída
 * (movimentações) simulando operação normal (~90%) e anomalias
 * industriais (~10%):
 *   1. bloqueado_fifo        -> tentativa de pegar um lote mais novo,
 *                               pulando o lote mais antigo disponível.
 *   2. bloqueado_vencido     -> tentativa de saída de um lote já
 *                               com data de validade expirada.
 *   3. bloqueado_quantidade  -> tentativa de retirar mais do que o
 *                               saldo disponível no lote.
 *
 * Uso:
 *   node simulator.js --mode=historico --quantidade=2000
 *   node simulator.js --mode=live --intervalo=2000
 *   node simulator.js --mode=historico --quantidade=1000 --mysql
 *
 * Flags:
 *   --mode=historico|live   (default: live)
 *   --quantidade=N          registros no modo histórico (default: 2000)
 *   --intervalo=MS          intervalo entre eventos no modo live (default: 2000)
 *   --anomalia=0.10         probabilidade de anomalia, 0 a 1 (default: 0.10)
 *   --mysql                 também grava no MySQL (requer env vars DB_* e `npm i mysql2`)
 *
 * Saída (sempre gerada, independente de --mysql):
 *   mock/output/seed_produtos.json
 *   mock/output/seed_lotes.json
 *   mock/output/movimentacoes.ndjson   (um JSON por linha, streaming-friendly)
 */

const fs = require('fs');
const path = require('path');

// ------------------------------------------------------------
// Configuração via linha de comando
// ------------------------------------------------------------
const args = process.argv.slice(2);

function getArg(name, def) {
  const prefix = `--${name}=`;
  const found = args.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : def;
}

const MODE = getArg('mode', 'live'); // 'live' | 'historico'
const INTERVALO_MS = parseInt(getArg('intervalo', '2000'), 10);
const QUANTIDADE_HISTORICO = parseInt(getArg('quantidade', '2000'), 10);
const PROB_ANOMALIA = parseFloat(getArg('anomalia', '0.10'));
const USE_MYSQL = args.includes('--mysql');

const OUTPUT_DIR = path.join(__dirname, 'output');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ------------------------------------------------------------
// Utilidades
// ------------------------------------------------------------
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 3) {
  const v = Math.random() * (max - min) + min;
  return parseFloat(v.toFixed(decimals));
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toSqlDate(date) {
  return date.toISOString().slice(0, 10);
}

function toSqlDatetime(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

// ------------------------------------------------------------
// Seed: produtos (resinas e aditivos — contexto do almoxarifado)
// ------------------------------------------------------------
const PRODUTOS = [
  { sku: 'RES-PP-001', nome: 'Resina Polipropileno PP-H', unidade_medida: 'KG' },
  { sku: 'RES-PE-002', nome: 'Resina Polietileno PE-AD', unidade_medida: 'KG' },
  { sku: 'RES-PVC-003', nome: 'Resina PVC Suspensão', unidade_medida: 'KG' },
  { sku: 'ADT-COL-004', nome: 'Aditivo Colorante Master', unidade_medida: 'KG' },
  { sku: 'ADT-EST-005', nome: 'Aditivo Estabilizante UV', unidade_medida: 'KG' },
];

function gerarLotes(produtos) {
  let loteIdSeq = 1;
  const lotes = [];

  produtos.forEach((produto, produtoIndex) => {
    const numLotes = randomInt(4, 8);
    for (let i = 0; i < numLotes; i++) {
      const idadeDias = randomInt(1, 60);
      const dataFabricacao = daysAgo(idadeDias);
      const validadeDias = randomInt(90, 180);
      let dataValidade = addDays(dataFabricacao, validadeDias);

      // ~8% dos lotes já nascem vencidos — cenário de anomalia pronto
      // para ser detectado pela regra FIFO (lote vencido tentando sair).
      if (Math.random() < 0.08) {
        dataValidade = daysAgo(randomInt(1, 10));
      }

      const qtdInicial = randomFloat(500, 1200, 1);

      lotes.push({
        id: loteIdSeq++,
        produto_id: produtoIndex + 1,
        numero_lote: `L${String(produtoIndex + 1).padStart(2, '0')}${String(i + 1).padStart(3, '0')}`,
        posicao: `F${String(randomInt(1, 20)).padStart(2, '0')}`,
        data_fabricacao: toSqlDate(dataFabricacao),
        data_validade: toSqlDate(dataValidade),
        qtd_inicial: qtdInicial,
        qtd_atual: qtdInicial,
        status: 'disponivel',
      });
    }
  });

  return lotes;
}

// ------------------------------------------------------------
// Geração de uma movimentação (evento de saída)
// ------------------------------------------------------------
function gerarMovimentacao(lotes, movIdSeq) {
  const disponiveis = lotes.filter((l) => l.status === 'disponivel' && l.qtd_atual > 0);
  if (disponiveis.length === 0) return null;

  const produtoIds = [...new Set(disponiveis.map((l) => l.produto_id))];
  const produtoAlvo = produtoIds[randomInt(0, produtoIds.length - 1)];
  const lotesDoProduto = disponiveis
    .filter((l) => l.produto_id === produtoAlvo)
    .sort((a, b) => new Date(a.data_fabricacao) - new Date(b.data_fabricacao));

  const loteCorreto = lotesDoProduto[0]; // mais antigo = regra FIFO
  const ehAnomalia = Math.random() < PROB_ANOMALIA;

  let loteEscolhido = loteCorreto;
  let status = 'sucesso';
  let observacao = 'Saída conforme FIFO';

  if (ehAnomalia) {
    const tipoAnomalia = randomInt(1, 3);

    if (tipoAnomalia === 1 && lotesDoProduto.length > 1) {
      // Operador tenta pegar um lote mais novo, pulando o mais antigo
      loteEscolhido = lotesDoProduto[randomInt(1, lotesDoProduto.length - 1)];
      status = 'bloqueado_fifo';
      observacao = `Tentativa de retirar lote ${loteEscolhido.numero_lote} fora de ordem (lote correto seria ${loteCorreto.numero_lote})`;
    } else if (tipoAnomalia === 2) {
      // Lote vencido tentando passar
      const vencido = lotes.find(
        (l) => l.produto_id === produtoAlvo && new Date(l.data_validade) < new Date() && l.qtd_atual > 0
      );
      if (vencido) {
        loteEscolhido = vencido;
        status = 'bloqueado_vencido';
        observacao = `Tentativa de saída de lote vencido (validade ${vencido.data_validade})`;
      }
    } else {
      // Quantidade solicitada maior que o saldo do lote
      loteEscolhido = loteCorreto;
      status = 'bloqueado_quantidade';
      observacao = 'Quantidade solicitada maior que o saldo disponível do lote';
    }
  }

  let quantidadeSolicitada;
  if (status === 'bloqueado_quantidade') {
    quantidadeSolicitada = parseFloat((loteEscolhido.qtd_atual + randomFloat(50, 200, 1)).toFixed(1));
  } else {
    const maxSaque = Math.max(10, Math.min(120, loteEscolhido.qtd_atual));
    quantidadeSolicitada = randomFloat(10, maxSaque, 1);
  }

  if (status === 'sucesso') {
    loteEscolhido.qtd_atual = parseFloat((loteEscolhido.qtd_atual - quantidadeSolicitada).toFixed(3));
    if (loteEscolhido.qtd_atual <= 0) {
      loteEscolhido.qtd_atual = 0;
      loteEscolhido.status = 'consumido';
    }
  }

  return {
    id: movIdSeq,
    lote_id: loteEscolhido.id,
    tipo: 'saida',
    quantidade: quantidadeSolicitada,
    status,
    observacao,
    criado_em: toSqlDatetime(new Date()),
  };
}

// ------------------------------------------------------------
// Persistência em arquivo (sempre acontece, mesmo com --mysql)
// ------------------------------------------------------------
function salvarJson(nomeArquivo, dado) {
  fs.writeFileSync(path.join(OUTPUT_DIR, nomeArquivo), JSON.stringify(dado, null, 2), 'utf-8');
}

function anexarNdjson(nomeArquivo, registro) {
  fs.appendFileSync(path.join(OUTPUT_DIR, nomeArquivo), JSON.stringify(registro) + '\n', 'utf-8');
}

// ------------------------------------------------------------
// MySQL opcional (--mysql). Requer `npm i mysql2` e variáveis
// de ambiente DB_HOST, DB_USER, DB_PASSWORD, DB_NAME.
// ------------------------------------------------------------
async function getMysqlPool() {
  const mysql = require('mysql2/promise');
  return mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cristal_master',
  });
}

async function inserirSeedMysql(pool, produtos, lotes) {
  for (let i = 0; i < produtos.length; i++) {
    const p = produtos[i];
    await pool.query(
      `INSERT INTO produtos (id, sku, nome, unidade_medida) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE nome = VALUES(nome)`,
      [i + 1, p.sku, p.nome, p.unidade_medida]
    );
  }
  for (const l of lotes) {
    await pool.query(
      `INSERT INTO lotes (id, produto_id, numero_lote, posicao, data_fabricacao, data_validade, qtd_inicial, qtd_atual, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE qtd_atual = VALUES(qtd_atual), status = VALUES(status)`,
      [l.id, l.produto_id, l.numero_lote, l.posicao, l.data_fabricacao, l.data_validade, l.qtd_inicial, l.qtd_atual, l.status]
    );
  }
}

async function inserirMovimentacaoMysql(pool, mov) {
  await pool.query(
    `INSERT INTO movimentacoes (lote_id, tipo, quantidade, status, observacao, criado_em)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [mov.lote_id, mov.tipo, mov.quantidade, mov.status, mov.observacao, mov.criado_em]
  );
}

// ------------------------------------------------------------
// Execução
// ------------------------------------------------------------
async function main() {
  console.log(`Simulador Cristal Master — modo: ${MODE}${USE_MYSQL ? ' (também gravando no MySQL)' : ' (apenas arquivo)'}`);

  const lotes = gerarLotes(PRODUTOS);
  salvarJson('seed_produtos.json', PRODUTOS.map((p, i) => ({ id: i + 1, ...p })));
  salvarJson('seed_lotes.json', lotes);

  let pool = null;
  if (USE_MYSQL) {
    pool = await getMysqlPool();
    await inserirSeedMysql(pool, PRODUTOS, lotes);
  }

  const movFile = 'movimentacoes.ndjson';
  fs.writeFileSync(path.join(OUTPUT_DIR, movFile), '', 'utf-8'); // zera o arquivo a cada execução

  let movIdSeq = 1;

  async function emitirEvento() {
    const mov = gerarMovimentacao(lotes, movIdSeq);
    if (!mov) {
      console.log('Todos os lotes foram consumidos. Encerrando simulação.');
      return false;
    }
    anexarNdjson(movFile, mov);
    if (pool) await inserirMovimentacaoMysql(pool, mov);
    console.log(`[${mov.criado_em}] lote=${mov.lote_id} qtd=${mov.quantidade} status=${mov.status}`);
    movIdSeq++;
    return true;
  }

  if (MODE === 'historico') {
    for (let i = 0; i < QUANTIDADE_HISTORICO; i++) {
      const continuar = await emitirEvento();
      if (!continuar) break;
    }
    console.log(`Gerados ${movIdSeq - 1} registros em mock/output/${movFile}`);
    if (pool) await pool.end();
    process.exit(0);
  } else {
    const loop = setInterval(async () => {
      const continuar = await emitirEvento();
      if (!continuar) {
        clearInterval(loop);
        if (pool) await pool.end();
        process.exit(0);
      }
    }, INTERVALO_MS);
  }
}

main().catch((err) => {
  console.error('Erro no simulador:', err);
  process.exit(1);
});
