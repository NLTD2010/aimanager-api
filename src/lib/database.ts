import { Database } from "bun:sqlite";
import { config } from "../config";
import { initializeDatabaseSchema } from "../utils/databaseSchema";

let database: Database | null = null;

export function getDatabase(){
  if (!database){
    database = new Database(config.databasePath, { create: true });
    initializeDatabaseSchema(database);
  }
  return database;
}

export type UserRecord = {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  created_at: string;
  last_login: string | null;
};

export type ChatRecord = {
  id: string;
  user_id: string;
  header: string;
  model: string;
  created_at: string;
  updated_at: string;
};

export type ChatTurnRecord = {
  id: number;
  chat_id: string;
  turn_index: number;
  question: string;
  response: string;
  created_at: string;
};

export function createUser(input: { id: string; username: string; email: string; passwordHash: string; createdAt: string }){
  const db = getDatabase();
  db.query(`INSERT INTO users (id, username, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)`)
    .run(input.id, input.username, input.email.toLowerCase(), input.passwordHash, input.createdAt);
}

export function findUserByIdentifier(identifier: string){
  const db = getDatabase();
  return db
    .query<UserRecord, [string, string]>(`SELECT * FROM users WHERE lower(username) = lower(?) OR lower(email) = lower(?) LIMIT 1`)
    .get(identifier, identifier) ?? null;
}

export function findUserById(id: string){
  const db = getDatabase();
  return db.query<UserRecord, [string]>(`SELECT * FROM users WHERE id = ? LIMIT 1`).get(id) ?? null;
}

export function updateLastLogin(userId: string, lastLogin: string){
  getDatabase().query(`UPDATE users SET last_login = ? WHERE id = ?`).run(lastLogin, userId);
}

export function createChat(input: { id: string; userId: string; header: string; model: string; createdAt: string; updatedAt: string }){
  getDatabase()
    .query(`INSERT INTO chats (id, user_id, header, model, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(input.id, input.userId, input.header, input.model, input.createdAt, input.updatedAt);
}

export function updateChatHeader(chatId: string, userId: string, header: string, updatedAt: string){
  getDatabase()
    .query(`UPDATE chats SET header = ?, updated_at = ? WHERE id = ? AND user_id = ?`)
    .run(header, updatedAt, chatId, userId);
}

export function updateChatModel(chatId: string, userId: string, model: string, updatedAt: string){
  getDatabase()
    .query(`UPDATE chats SET model = ?, updated_at = ? WHERE id = ? AND user_id = ?`)
    .run(model, updatedAt, chatId, userId);
}

export function findChatById(chatId: string, userId: string){
  return getDatabase()
    .query<ChatRecord, [string, string]>(`SELECT * FROM chats WHERE id = ? AND user_id = ? LIMIT 1`)
    .get(chatId, userId) ?? null;
}

export function listChats(userId: string){
  return getDatabase().query<ChatRecord, [string]>(`SELECT * FROM chats WHERE user_id = ? ORDER BY created_at DESC`).all(userId);
}

export function searchChatsByHeader(userId: string, query: string){
  const pattern = `%${query.toLowerCase()}%`;
  return getDatabase()
    .query<ChatRecord, [string, string]>(`SELECT * FROM chats WHERE user_id = ? AND lower(header) LIKE ? ORDER BY created_at DESC`)
    .all(userId, pattern);
}

export function countTurns(chatId: string){
  const row = getDatabase()
    .query<{ count: number }, [string]>(`SELECT COUNT(*) as count FROM chat_turns WHERE chat_id = ?`)
    .get(chatId);
  return row?.count ?? 0;
}

export function addTurn(input: { chatId: string; question: string; response: string; createdAt: string }){
  const turnIndex = countTurns(input.chatId) + 1;
  const result = getDatabase()
    .query(`INSERT INTO chat_turns (chat_id, turn_index, question, response, created_at) VALUES (?, ?, ?, ?, ?)`)
    .run(input.chatId, turnIndex, input.question, input.response, input.createdAt);
  return {
    id: Number(result.lastInsertRowid),
    chat_id: input.chatId,
    turn_index: turnIndex,
    question: input.question,
    response: input.response,
    created_at: input.createdAt
  } satisfies ChatTurnRecord;
}

export function listTurns(chatId: string){
  return getDatabase()
    .query<ChatTurnRecord, [string]>(`SELECT * FROM chat_turns WHERE chat_id = ? ORDER BY turn_index ASC`)
    .all(chatId);
}
