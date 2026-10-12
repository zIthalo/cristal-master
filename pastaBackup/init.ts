import mysql from 'mysql2/promise';
import { env } from '../config/env';
import { pool } from '../config/database';
import { SCHEMA_STATEMENTS } from './schema';

/**
 * Prepara o banco na inicialização da API:
 * 1. cria o banco se ele não existir (conexão sem "database");
 * 2. cria as tabelas se não existirem (DDL idempotente);
 * 3. confirma que o pool principal consegue falar com o banco.
 * Pode rodar a cada start sem perder dados.
 */
export async function initDatabase(): Promise<void> {
  const { host, port, user, password, database } = env.db;

  // O nome do banco já foi validado em env.ts (apenas letras, números e "_"),
  // por isso é seguro usá-lo entre crases no CREATE DATABASE.
  const admin = await mysql.createConnection({ host, port, user, password, connectTimeout: 5000 });
  try {
    await admin.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await admin.end();
  }

  // Ordem importa: produtos -> lotes -> movimentacoes (chaves estrangeiras).
  for (const statement of SCHEMA_STATEMENTS) {
    await pool.query(statement);
  }

  await pool.query('SELECT 1');
}
