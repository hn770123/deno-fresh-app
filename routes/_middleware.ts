/**
 * 認証ミドルウェアモジュール
 * すべてのリクエストに対して認証チェックを行い、未ログインユーザーをログイン画面へ誘導します。
 */

import { define, getSessionId } from "../utils.ts";
import { AppDatabase } from "../db.ts";

/**
 * 認証チェックミドルウェア
 */
export const handler = define.middleware(async (ctx) => {
  const { pathname } = new URL(ctx.req.url);

  // ログインページ、静的ファイルなどは認証チェックをスキップ
  if (
    pathname === "/login" ||
    pathname.startsWith("/static/") ||
    pathname.startsWith("/_fresh/") ||
    pathname === "/favicon.ico"
  ) {
    return await ctx.next();
  }

  // セッションCookieの確認
  const sessionId = getSessionId(ctx.req);

  if (!sessionId) {
    return redirectToLogin();
  }

  // データベースでセッションの有効性を確認
  const sessionResult = AppDatabase.getSessionWithUser(sessionId);

  if (!sessionResult) {
    return redirectToLogin();
  }

  // ユーザー情報をステートに保存
  ctx.state.user = sessionResult.user;

  // 認証済み
  return await ctx.next();
});

function redirectToLogin() {
  return new Response(null, {
    status: 302,
    headers: { location: "/login" },
  });
}
