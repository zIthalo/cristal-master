import { app } from '../../../app';
import { env } from './config/env';
import { initDatabase } from './database/init';

async function main(): Promise<void> {
  await initDatabase();
  console.log(`Banco "${env.db.database}" pronto (tabelas verificadas/criadas).`);

  app.listen(env.port, () => {
    console.log(`API rodando em http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error('Falha ao iniciar a API:', err);
  process.exit(1);
});
