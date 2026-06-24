/**
 * データベース管理およびデータアクセスモジュール
 * SQLiteデータベースへの接続、テーブルの初期化、および各エンティティの操作関数を提供します。
 */

import { Database } from "@db/sqlite";

/**
 * データベースインスタンスの作成
 */
const db = new Database("app.db");

// --- テーブル初期化 ---

/** ユーザー情報を保存するための users テーブル */
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

/** セッション情報を保存するための sessions テーブル */
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )
`);

/** レポート情報を保存するための reports テーブル */
db.exec(`
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    summary TEXT,
    details TEXT,
    creator_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users (id)
  )
`);

// --- インターフェース ---

export interface User {
  id: number;
  username: string;
  password?: string;
  email?: string;
  created_at?: string;
}

export interface Session {
  id: string;
  user_id: number;
  expires_at: string;
}

export interface Report {
  id: number;
  title: string;
  summary?: string;
  details?: string;
  creator_id: number;
  creator_name?: string;
  created_at: string;
}

// --- サービス関数 (userService) ---

export const userService = {
  getById(id: number): User | undefined {
    return db.prepare("SELECT id, username FROM users WHERE id = ?").get(id) as User | undefined;
  },
  getByUsername(username: string): User | undefined {
    return db.prepare("SELECT id, username, password FROM users WHERE username = ?").get(username) as User | undefined;
  },
  create(username: string, passwordHash: string, email: string): number | bigint {
    db.prepare("INSERT INTO users (username, password, email) VALUES (?, ?, ?)").run(username, passwordHash, email);
    return db.lastInsertRowId;
  },
};

// --- サービス関数 (sessionService) ---

export const sessionService = {
  getById(id: string): Session | undefined {
    return db.prepare("SELECT user_id, expires_at FROM sessions WHERE id = ?").get(id) as Session | undefined;
  },
  create(id: string, userId: number, expiresAt: Date): void {
    db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").run(id, userId, expiresAt.toISOString());
  },
  delete(id: string): void {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(id);
  },
};

// --- サービス関数 (reportService) ---

export const reportService = {
  getAllWithCreator(): Report[] {
    return db.prepare(`
      SELECT r.id, r.title, r.created_at, u.username as creator_name
      FROM reports r
      JOIN users u ON r.creator_id = u.id
      ORDER BY r.created_at DESC
    `).all() as Report[];
  },
  create(title: string, summary: string | undefined, details: string | undefined, creatorId: number): number | bigint {
    db.prepare("INSERT INTO reports (title, summary, details, creator_id) VALUES (?, ?, ?, ?)").run(title, summary, details, creatorId);
    return db.lastInsertRowId;
  },
};

export default db;
