import express from 'express';
import { routes } from './routes';
import { errorHandler, notFound } from './middlewares/error.middleware';

// Separado do server.ts para poder ser importado pelo Supertest nos testes.
export const app = express();

app.disable('x-powered-by');
app.use(express.json());
app.use(routes);
app.use(notFound);
app.use(errorHandler);
