import type { Database } from "bun:sqlite";

export function initializeDatabaseSchema(db: Database){
  db.run(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      last_login TEXT
    );

    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      header TEXT NOT NULL,
      model TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chat_turns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id TEXT NOT NULL,
      turn_index INTEGER NOT NULL,
      question TEXT NOT NULL,
      response TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
      UNIQUE(chat_id, turn_index)
    );

    CREATE INDEX IF NOT EXISTS idx_chats_user_created_at ON chats(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_chats_user_header ON chats(user_id, header);
    CREATE INDEX IF NOT EXISTS idx_turns_chat_index ON chat_turns(chat_id, turn_index);
  `);
}