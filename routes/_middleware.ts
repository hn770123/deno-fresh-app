/**
 * 認証ミドルウェアモジュール
 * すべてのリクエストに対して認証チェックを行い、未ログインユーザーをログイン画面へ誘導します。
 */

import { define } from "../utils.ts";
import db from "../db.ts";
import { getSessionId } from "../auth_utils.ts";

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
  const session = db.prepare("SELECT user_id, expires_at FROM sessions WHERE id = ?").get(sessionId) as { user_id: number, expires_at: string } | undefined;

  if (!session || new Date(session.expires_at) < new Date()) {
    // セッションが無効または期限切れ
    if (session) {
      db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
    }
    return redirectToLogin();
  }

  // 認証済み
  return await ctx.next();
});

function redirectToLogin() {
  return new Response(null, {
    status: 302,
    headers: { location: "/login" },
  });
}
