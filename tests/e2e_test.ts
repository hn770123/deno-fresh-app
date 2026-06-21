/**
 * E2Eテストモジュール
 * Playwrightを使用してアプリケーションの動作を確認します。
 * ログインフローとトップページの表示を確認します。
 */

import { chromium } from "playwright";
import { assertEquals } from "jsr:@std/assert";
import db from "../db.ts";
import { hashPassword } from "../auth_utils.ts";

Deno.test("ホームページのE2Eテスト", async (t) => {
  // サーバーの起動 (Deno Fresh サーバーを本番モードで起動)
  const serverProcess = new Deno.Command(Deno.execPath(), {
    args: ["serve", "-A", "_fresh/server.js"],
    stdout: "piped",
    stderr: "inherit",
  }).spawn();

  let serverStarted = false;
  const reader = serverProcess.stdout.getReader();
  const decoder = new TextDecoder();

  try {
    // サーバーが起動してポート 8000 で待機するのを待つためのタイムアウト設定
    const timeout = setTimeout(() => {
      if (!serverStarted) {
        console.error("サーバー起動タイムアウト");
        try {
          serverProcess.kill();
        } catch (_) {
          // すでに終了している場合は無視
        }
      }
    }, 30000);

    let output = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      output += text;
      // ログ出力（デバッグ用）
      console.log(text);
      // 起動完了メッセージを確認
      if (output.includes("8000")) {
        serverStarted = true;
        clearTimeout(timeout);
        break;
      }
    }

    // 残りの標準出力をバックグラウンドでドレインする（バッファ詰まり防止）
    (async () => {
      while (true) {
        const { done } = await reader.read();
        if (done) break;
      }
    })();

    if (!serverStarted) {
      throw new Error("サーバーの起動に失敗しました。");
    }

    // テスト用のユーザーデータを準備
    const testUsername = "testuser";
    const testPassword = "password123";
    const user = db.prepare("SELECT id FROM users WHERE username = ?").get(testUsername);
    if (!user) {
      // ユーザーが存在しない場合は新規作成
      const hashedPassword = await hashPassword(testPassword);
      db.prepare("INSERT INTO users (username, password, email) VALUES (?, ?, ?)").run(
        testUsername,
        hashedPassword,
        "test@example.com",
      );
    }

    // Playwrightによるテストシナリオの実行
    await t.step("ログインしてトップページが表示されること", async () => {
      const browser = await chromium.launch();
      const page = await browser.newPage();
      try {
        // ログインページへ移動
        await page.goto("http://localhost:8000/login");
        // フォームが表示されるのを待機
        await page.waitForSelector("#username", { state: "visible" });
        // ログイン情報を入力
        await page.fill("#username", testUsername);
        await page.fill("#password", testPassword);
        // 送信ボタンをクリック
        await page.click('button[type="submit"]');

        // ホームページ（トップ）への遷移を確認
        await page.waitForURL("http://localhost:8000/");
        const content = await page.textContent("h1");
        // 「Hello World」が表示されていることを検証
        assertEquals(content, "Hello World");
      } finally {
        // ブラウザを閉じる
        await browser.close();
      }
    });
  } finally {
    // サーバープロセスを確実に停止させる
    try {
      serverProcess.kill();
    } catch (_) {
      // すでに終了している場合は無視
    }
    await serverProcess.status;
  }
});
