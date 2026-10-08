import type { Request, Response } from 'express';
import { pool } from '../config/database';

const TIMEOUT_MS = 3000;

/**
 * GET /health
 * Executa um SELECT 1 de verdade no banco a cada chamada (sem cache).
 * - Banco respondeu          -> 200 { status: 'healthy',   database: 'connected' }
 * - Erro ou timeout (3 s)    -> 503 { status: 'unhealthy', database: 'disconnected' }
 * O erro real vai só para o log do servidor, nunca para o cliente.
 */
export async function health(_req: Request, res: Response): Promise<void> {
  let timer: NodeJS.Timeout | undefined;

  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`timeout de ${TIMEOUT_MS} ms no banco`)), TIMEOUT_MS);
    });

    await Promise.race([pool.query('SELECT 1'), timeout]);

    res.status(200).json({ status: 'healthy', database: 'connected' });
  } catch (err) {
    console.error('Falha no health check do banco:', err);
    res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
  } finally {
    if (timer) clearTimeout(timer);
  }
}
