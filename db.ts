/**
 * データベース管理モジュール
 * SQLiteデータベースへの接続とテーブルの初期化を行います。
 */

import { Database } from "@db/sqlite";
import { hashPassword } from "./auth_utils.ts";

/**
 * データベースインスタンスの作成
 * データの永続化のために 'app.db' ファイルを使用します。
 */
const db = new Database("app.db");

/**
 * ユーザー情報を保存するための users テーブルを作成します。
 */
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

/**
 * セッション情報を保存するための sessions テーブルを作成します。
 */
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )
`);

/**
 * テストユーザーの作成
 * 開発およびテストの利便性のために、初期状態で 'testuser' を作成します。
 */
async function initializeTestUser() {
  const testUsername = "testuser";
  const testPassword = "password123";
  const testEmail = "test@example.com";

  const user = db.prepare("SELECT id FROM users WHERE username = ?").get(testUsername);
  if (!user) {
    const hashedPassword = await hashPassword(testPassword);
    db.prepare("INSERT INTO users (username, password, email) VALUES (?, ?, ?)").run(
      testUsername,
      hashedPassword,
      testEmail,
    );
    console.log(`Test user '${testUsername}' created.`);
  }
}

// 非同期で初期化を実行（トップレベル await を使用）
await initializeTestUser();

export default db;
