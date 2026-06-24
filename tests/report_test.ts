import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import db from "../services/db.ts";

Deno.test("reportsテーブルの基本操作テスト", async (t) => {
  // テスト用ユーザーの作成（一意なユーザー名を使用）
  const username = `testuser_${Date.now()}`;
  db.prepare("INSERT INTO users (username, password, email) VALUES (?, ?, ?)").run(
    username,
    "password123",
    `${username}@example.com`
  );
  const user = db.prepare("SELECT id FROM users WHERE username = ?").get(username) as { id: number };

  await t.step("レポートの挿入ができること", () => {
    const title = "テストレポート";
    const summary = "これはテストレポートの概要です。";
    const details = "これはテストレポートの詳細です。";

    const result = db.prepare(
      "INSERT INTO reports (title, summary, details, creator_id) VALUES (?, ?, ?, ?)"
    ).run(title, summary, details, user.id);

    assertEquals(result, 1);
  });

  await t.step("レポートの取得ができること", () => {
    const reports = db.prepare(`
      SELECT r.title, u.username as creator_name
      FROM reports r
      JOIN users u ON r.creator_id = u.id
      WHERE u.id = ?
    `).all(user.id) as { title: string; creator_name: string }[];

    assertEquals(reports.length, 1);
    assertEquals(reports[0].title, "テストレポート");
    assertEquals(reports[0].creator_name, username);
  });

  // テストデータのクリーンアップ
  db.prepare("DELETE FROM reports WHERE creator_id = ?").run(user.id);
  db.prepare("DELETE FROM users WHERE id = ?").run(user.id);
});
