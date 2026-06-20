/**
 * メインルートモジュール
 * このモジュールは、アプリケーションのホームページを定義します。
 */

import { define } from "../utils.ts";

/**
 * ホームページコンポーネント
 * @returns 描画されるJSX要素
 */
export default define.page(function Home() {
  return (
    <div class="px-4 py-8 mx-auto min-h-screen flex flex-col items-center justify-center">
      <head>
        <title>検証Webアプリケーション</title>
      </head>
      <h1 class="text-4xl font-bold">Hello World</h1>
      <p class="my-4">
        Deno Fresh + Tailwind CSS
      </p>
    </div>
  );
});
