import { assertEquals } from "jsr:@std/assert";
import { AppDatabase } from "../db.ts";

Deno.test("reportsテーブルの基本操作テスト", async (t) => {
  // テスト用ユーザーの作成（一意なユーザー名を使用）
  const username = `testuser_${Date.now()}`;
  AppDatabase.raw.prepare("INSERT INTO users (username, password, email) VALUES (?, ?, ?)").run(
    username,
    "password123",
    `${username}@example.com`
  );
  const user = AppDatabase.getUserByUsername(username)!;

  await t.step("レポートの挿入ができること", () => {
    const title = "テストレポート";
    const summary = "これはテストレポートの概要です。";
    const details = "これはテストレポートの詳細です。";

    const result = AppDatabase.createReport(title, summary, details, user.id);

    // @db/sqlite の run は変更された行数を返す(number)
    assertEquals(result, 1);
  });

  await t.step("レポートの取得ができること", () => {
    const reports = AppDatabase.getReportsWithUsers();

    // 作成したレポートが含まれているか確認
    const myReport = reports.find(r => r.title === "テストレポート" && r.creator_name === username);

    assertEquals(!!myReport, true);
    assertEquals(myReport?.title, "テストレポート");
    assertEquals(myReport?.creator_name, username);
  });

  // テストデータのクリーンアップ
  AppDatabase.raw.prepare("DELETE FROM reports WHERE creator_id = ?").run(user.id);
  AppDatabase.raw.prepare("DELETE FROM users WHERE id = ?").run(user.id);
});
