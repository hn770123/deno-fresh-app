/**
 * E2Eテストモジュール
 * Playwrightを使用してアプリケーションの動作を確認します。
 */

import { chromium } from "playwright";
import { assertEquals } from "jsr:@std/assert";

Deno.test("ホームページのE2Eテスト", async (t) => {
  // サーバーの起動 (deno task dev は vite を起動する)
  const serverProcess = new Deno.Command(Deno.execPath(), {
    args: ["task", "dev"],
    stdout: "piped",
    stderr: "piped",
  }).spawn();

  let serverStarted = false;
  const reader = serverProcess.stdout.getReader();
  const errReader = serverProcess.stderr.getReader();
  const decoder = new TextDecoder();

  // stderrをドレインする（バッファ詰まり防止）
  (async () => {
    while (true) {
      const { done } = await errReader.read();
      if (done) break;
    }
  })();

  try {
    // サーバーが起動してポート 5173 で待機するのを待つ
    const timeout = setTimeout(() => {
      if (!serverStarted) {
        console.error("Server start timeout");
        serverProcess.kill();
      }
    }, 30000);

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      console.log(text);
      if (text.includes("5173")) {
        serverStarted = true;
        clearTimeout(timeout);
        break;
      }
    }

    // 残りのstdoutをドレインする（別スレッドで）
    (async () => {
      while (true) {
        const { done } = await reader.read();
        if (done) break;
      }
    })();

    if (!serverStarted) {
      throw new Error("Server failed to start");
    }

    // テストの実行
    await t.step("トップページにHello Worldが表示されていること", async () => {
      const browser = await chromium.launch();
      const page = await browser.newPage();
      try {
        await page.goto("http://localhost:5173");
        const content = await page.textContent("h1");
        assertEquals(content, "Hello World");
      } finally {
        await browser.close();
      }
    });
  } finally {
    // サーバーの停止を確実に行う
    serverProcess.kill();
    await serverProcess.status;
  }
});
