import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbDir = path.join(__dirname, '..', 'data');
const dbPath = process.env.DB_PATH || path.join(dbDir, 'ecoviva.db');

const dbPathDir = path.dirname(dbPath);
if (!fs.existsSync(dbPathDir)) {
  fs.mkdirSync(dbPathDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export default db;
