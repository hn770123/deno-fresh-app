/**
 * データベース管理モジュール
 * SQLiteデータベースへの接続とテーブルの初期化を行います。
 */

import { Database } from "@db/sqlite";

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
 * レポート情報を保存するための reports テーブルを作成します。
 */
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

export default db;
