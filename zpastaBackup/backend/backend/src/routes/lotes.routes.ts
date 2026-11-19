import { Router } from 'express';
import { listar } from '../controllers/lotes.controller';

export const lotesRouter = Router();

lotesRouter.get('/lotes', listar);
