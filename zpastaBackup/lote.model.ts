import type { RowDataPacket } from 'mysql2';
import { pool } from '../config/database';

export const STATUS_LOTE = ['disponivel', 'consumido', 'vencido'] as const;
export type StatusLote = (typeof STATUS_LOTE)[number];

export interface LoteRow extends RowDataPacket {
  id: number;
  produto_id: number;
  sku: string;
  produto_nome: string;
  numero_lote: string;
  posicao: string;
  data_fabricacao: string; // 'YYYY-MM-DD' (dateStrings no pool)
  data_validade: string;
  qtd_inicial: number; // DECIMAL vem como number (decimalNumbers no pool)
  qtd_atual: number;
  status: StatusLote;
}

export interface FiltroLotes {
  produtoId?: number;
  status?: StatusLote;
}

/**
 * Lista lotes em ordem FIFO: o mais antigo (data_fabricacao) primeiro.
 * Os valores dos filtros sempre vão como parâmetros (?), nunca concatenados.
 */
export async function listarLotes(filtro: FiltroLotes = {}): Promise<LoteRow[]> {
  const condicoes: string[] = [];
  const params: Array<number | string> = [];

  if (filtro.produtoId !== undefined) {
    condicoes.push('l.produto_id = ?');
    params.push(filtro.produtoId);
  }
  if (filtro.status !== undefined) {
    condicoes.push('l.status = ?');
    params.push(filtro.status);
  }

  const where = condicoes.length > 0 ? `WHERE ${condicoes.join(' AND ')}` : '';

  const [rows] = await pool.query<LoteRow[]>(
    `SELECT l.id, l.produto_id, p.sku, p.nome AS produto_nome, l.numero_lote, l.posicao,
            l.data_fabricacao, l.data_validade, l.qtd_inicial, l.qtd_atual, l.status
       FROM lotes l
       JOIN produtos p ON p.id = l.produto_id
       ${where}
      ORDER BY l.data_fabricacao ASC, l.id ASC`,
    params
  );

  return rows;
}
