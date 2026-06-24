/**
 * 認証ミドルウェアモジュール
 * すべてのリクエストに対して認証チェックを行い、未ログインユーザーをログイン画面へ誘導します。
 */

import { define } from "../utils/fresh.ts";
import { getSessionId } from "../utils/auth.ts";
import { sessionService, userService } from "../services/db.ts";

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
  const session = sessionService.getById(sessionId);

  if (!session || new Date(session.expires_at) < new Date()) {
    // セッションが無効または期限切れ
    if (session) {
      sessionService.delete(sessionId);
    }
    return redirectToLogin();
  }

  // ユーザー情報を取得してステートに保存
  const user = userService.getById(session.user_id);

  if (!user) {
    return redirectToLogin();
  }

  ctx.state.user = user;

  // 認証済み
  return await ctx.next();
});

function redirectToLogin() {
  return new Response(null, {
    status: 302,
    headers: { location: "/login" },
  });
}
