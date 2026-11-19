import type { Request, Response } from 'express';
import { listarLotes, STATUS_LOTE, type FiltroLotes, type StatusLote } from '../models/lote.model';

/**
 * GET /api/lotes?produto_id=1&status=disponivel
 * Consulta os lotes gerados pelo mock (carregados com `npm run seed`),
 * em ordem FIFO. Filtros opcionais; valor inválido devolve 400.
 */
export async function listar(req: Request, res: Response): Promise<void> {
  const { produto_id, status } = req.query;
  const filtro: FiltroLotes = {};

  if (produto_id !== undefined) {
    const valido = typeof produto_id === 'string' && /^[1-9]\d*$/.test(produto_id);
    const numero = valido ? Number(produto_id) : NaN;
    if (!Number.isSafeInteger(numero)) {
      res.status(400).json({ error: 'produto_id deve ser um inteiro positivo' });
      return;
    }
    filtro.produtoId = numero;
  }

  if (status !== undefined) {
    if (typeof status !== 'string' || !(STATUS_LOTE as readonly string[]).includes(status)) {
      res.status(400).json({ error: `status deve ser um de: ${STATUS_LOTE.join(', ')}` });
      return;
    }
    filtro.status = status as StatusLote;
  }

  const data = await listarLotes(filtro);
  res.json({ total: data.length, data });
}
