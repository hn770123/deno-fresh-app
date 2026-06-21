/**
 * E2Eテストモジュール
 * Playwrightを使用してアプリケーションの動作を確認します。
 * ログインフローとトップページの表示を確認します。
 */

import { chromium } from "playwright";
import { assertEquals } from "jsr:@std/assert";

Deno.test("ホームページのE2Eテスト", async (t) => {
  // サーバーの起動 (Deno Fresh サーバーを本番モードで起動)
  const serverProcess = new Deno.Command(Deno.execPath(), {
    args: ["serve", "-A", "_fresh/server.js"],
    stdout: "null",
    stderr: "null",
  }).spawn();

  let serverStarted = false;
  try {
    // サーバーが起動してポート 8000 で待機するのを待つためのポーリング
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch("http://localhost:8000/login");
        if (res.ok) {
          serverStarted = true;
          break;
        }
      } catch (_) {
        // まだ起動していない場合は待機
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (!serverStarted) {
      throw new Error("サーバーの起動に失敗しました。");
    }

    // テスト用のユーザーデータ（db.tsで初期化済み）
    const testUsername = "testuser";
    const testPassword = "password123";

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
