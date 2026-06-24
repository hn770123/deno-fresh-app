/**
 * アプリケーションのエントリーポイント
 * Freshアプリケーションの初期化とミドルウェアの設定を行います。
 */

import { App, staticFiles } from "fresh";
import { type State } from "./utils/fresh.ts";

// アプリケーションインスタンスの作成
export const app = new App<State>();

// 静的ファイルの提供
app.use(staticFiles());

// リクエストログ出力用ミドルウェア
app.use(async (ctx) => {
  console.log(`${ctx.req.method} ${ctx.req.url}`);
  return await ctx.next();
});

// ファイルシステムベースのルーティングを有効化
app.fsRoutes();

// サーバーの起動
if (import.meta.main) {
  await app.listen();
}
