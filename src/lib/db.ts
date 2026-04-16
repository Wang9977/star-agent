import Database from 'better-sqlite3';
import path from 'path';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'threads.db');

let db: Database.Database | null = null;

export async function getDb(): Promise<Database.Database> {
  if (!db) {
    if (!existsSync(DB_DIR)) {
      await mkdir(DB_DIR, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initializeTables(db);
  }
  return db;
}

function initializeTables(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS threads (
      id TEXT PRIMARY KEY,
      name TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (thread_id) REFERENCES threads(id)
    );

    CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
  `);
}

export interface Thread {
  id: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: number;
  threadId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}
