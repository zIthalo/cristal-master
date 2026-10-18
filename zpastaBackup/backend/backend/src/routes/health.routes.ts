import { Router } from 'express';
import { health } from '../controllers/health.controller';

export const healthRouter = Router();

healthRouter.get('/health', health);
