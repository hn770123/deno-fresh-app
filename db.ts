/**
 * データベース管理モジュール
 * SQLiteデータベースへの接続、テーブルの初期化、およびデータ操作メソッドを提供します。
 */

import { Database } from "@db/sqlite";

/**
 * データベースインスタンスの作成
 */
const db = new Database("app.db");

/**
 * テーブルの初期化
 */
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    summary TEXT,
    details TEXT,
    creator_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users (id)
  );
`);

/**
 * データベース操作クラス
 */
export class AppDatabase {
  /**
   * ユーザーをIDで取得します
   */
  static getUserById(id: number) {
    return db.prepare("SELECT id, username, email FROM users WHERE id = ?").get(id) as { id: number; username: string; email: string } | undefined;
  }

  /**
   * ユーザーをユーザー名で取得します
   */
  static getUserByUsername(username: string) {
    return db.prepare("SELECT id, username, password, email FROM users WHERE username = ?").get(username) as { id: number; username: string; password: string; email: string } | undefined;
  }

  /**
   * セッションを作成します
   */
  static createSession(id: string, userId: number, expiresAt: Date) {
    db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").run(
      id,
      userId,
      expiresAt.toISOString()
    );
  }

  /**
   * 有効なセッションをユーザー情報付きで取得します
   */
  static getSessionWithUser(sessionId: string) {
    const session = db.prepare("SELECT user_id, expires_at FROM sessions WHERE id = ?").get(sessionId) as { user_id: number; expires_at: string } | undefined;

    if (!session || new Date(session.expires_at) < new Date()) {
      if (session) {
        db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
      }
      return null;
    }

    const user = this.getUserById(session.user_id);
    return user ? { session, user } : null;
  }

  /**
   * 全レポートを、作成者名を含めて取得します
   */
  static getReportsWithUsers() {
    return db.prepare(`
      SELECT r.id, r.title, r.created_at, u.username as creator_name
      FROM reports r
      JOIN users u ON r.creator_id = u.id
      ORDER BY r.created_at DESC
    `).all() as { id: number; title: string; created_at: string; creator_name: string }[];
  }

  /**
   * 新しいレポートを登録します
   */
  static createReport(title: string, summary: string | undefined, details: string | undefined, creatorId: number) {
    return db.prepare(
      "INSERT INTO reports (title, summary, details, creator_id) VALUES (?, ?, ?, ?)"
    ).run(title, summary, details, creatorId);
  }

  /**
   * Raw Database インスタンスへのアクセス (特殊なクエリ用)
   */
  static get raw() {
    return db;
  }
}

export default db;
