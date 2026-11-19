import type { ErrorRequestHandler, RequestHandler } from 'express';

// Rota que não existe -> 404 em JSON.
export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
};

// Tratamento central de erros. Detalhes internos ficam só no log do servidor.
export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  // JSON malformado no corpo da requisição (express.json)
  if (err && typeof err === 'object' && (err as { type?: string }).type === 'entity.parse.failed') {
    res.status(400).json({ error: 'JSON inválido no corpo da requisição' });
    return;
  }

  console.error('Erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
};
