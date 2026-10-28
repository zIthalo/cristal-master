import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name} (veja o .env.example)`);
  }
  return value;
}

function parseDatabaseUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('DATABASE_URL inválida. Formato esperado: mysql://usuario:senha@host:3306/banco');
  }
  if (url.protocol !== 'mysql:') {
    throw new Error('DATABASE_URL deve começar com mysql://');
  }
  const database = url.pathname.replace(/^\//, '');
  // O nome do banco é usado em CREATE DATABASE; restringimos o formato por segurança.
  if (!/^[A-Za-z0-9_]+$/.test(database)) {
    throw new Error('DATABASE_URL: nome do banco deve conter apenas letras, números e "_"');
  }
  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
  };
}

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`PORT inválida: ${process.env.PORT}`);
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port,
  db: parseDatabaseUrl(required('DATABASE_URL')),
};
