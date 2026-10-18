import mysql from 'mysql2/promise';
import { env } from './env';

// Pool único, compartilhado por toda a aplicação.
export const pool = mysql.createPool({
  ...env.db,
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 5000,
  decimalNumbers: true, // DECIMAL vem como number (e não string)
  dateStrings: true, // DATE/DATETIME vêm como 'YYYY-MM-DD' (evita deslocamento de fuso)
});
