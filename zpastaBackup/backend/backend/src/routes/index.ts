import { Router } from 'express';
import { healthRouter } from './health.routes';
import { lotesRouter } from './lotes.routes';

// Agrupa todas as rotas; o app.ts só precisa importar `routes`.
export const routes = Router();

routes.use(healthRouter); // GET /health
routes.use('/api', lotesRouter); // GET /api/lotes
