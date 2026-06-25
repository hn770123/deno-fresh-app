/**
 * E2Eテストモジュール
 * Playwrightを使用してアプリケーションの動作を確認します。
 * ログインフロー、レポート作成、一覧表示の確認を行います。
 */

import { chromium } from "playwright";
import { assertEquals, assertStringIncludes } from "jsr:@std/assert";
import db, { AppDatabase } from "../db.ts";
import { hashPassword } from "../utils.ts";

Deno.test("検証WebアプリケーションのE2Eテスト", async (t) => {
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

    // テスト用のユーザーデータを準備
    const testUsername = "testuser";
    const testPassword = "password123";
    const user = AppDatabase.getUserByUsername(testUsername);
    if (!user) {
      // ユーザーが存在しない場合は新規作成
      const hashedPassword = await hashPassword(testPassword);
      db.prepare("INSERT INTO users (username, password, email) VALUES (?, ?, ?)").run(
        testUsername,
        hashedPassword,
        "test@example.com",
      );
    }

    const browser = await chromium.launch();
    const context = await browser.newContext();

    await t.step("ログインしてトップページが表示されること", async () => {
      const page = await context.newPage();
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
        const title = await page.textContent("h1");
        assertEquals(title, "レポート一覧");
      } finally {
        await page.close();
      }
    });

    await t.step("新規レポートが作成でき、一覧に表示されること", async () => {
      const page = await context.newPage();
      try {
        // すでにログイン済みのはずなのでトップページへ
        await page.goto("http://localhost:8000/");

        // 新規作成ボタンをクリック
        await page.click('a[href="/reports_new"]');
        await page.waitForURL("http://localhost:8000/reports_new");

        const reportTitle = `テストレポート_${Date.now()}`;
        const reportSummary = "これはE2Eテストで作成された概要です。";
        const reportDetails = "これはE2Eテストで作成された詳細内容です。";

        // フォームに入力
        await page.fill("#title", reportTitle);
        await page.fill("#summary", reportSummary);
        await page.fill("#details", reportDetails);

        // 登録ボタンをクリック
        await page.click('button[type="submit"]');

        // トップページへ戻ることを確認
        await page.waitForURL("http://localhost:8000/");

        // 一覧に作成したレポートが含まれているか確認
        const bodyContent = await page.textContent("body");
        assertStringIncludes(bodyContent || "", reportTitle);
      } finally {
        await page.close();
      }
    });

    await browser.close();
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
