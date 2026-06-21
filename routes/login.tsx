/**
 * ログインページモジュール
 * ログインフォームの表示と認証処理を行います。
 */

import { define } from "../utils.ts";
import db from "../db.ts";
import { verifyPassword, generateSessionId, setSessionCookie } from "../auth_utils.ts";

/**
 * ログインページのハンドラ
 */
export const handler = define.handlers({
  /**
   * ログイン処理 (POST)
   */
  async POST(ctx) {
    const form = await ctx.req.formData();
    const username = form.get("username")?.toString();
    const password = form.get("password")?.toString();

    if (!username || !password) {
      return ctx.render({ error: "ユーザー名とパスワードを入力してください。" });
    }

    // データベースからユーザーを取得
    const user = db.prepare("SELECT id, password FROM users WHERE username = ?").get(username) as { id: number, password: string } | undefined;

    if (!user || !(await verifyPassword(password, user.password))) {
      return ctx.render({ error: "ユーザー名またはパスワードが正しくありません。" });
    }

    // 認証成功: セッションを作成
    const sessionId = generateSessionId();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24時間有効

    db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").run(
      sessionId,
      user.id,
      expiresAt.toISOString()
    );

    const headers = new Headers();
    headers.set("location", "/");
    headers.set("set-cookie", setSessionCookie(sessionId));

    return new Response(null, {
      status: 303,
      headers,
    });
  },
});

/**
 * ログインページコンポーネント
 */
export default define.page(function LoginPage({ data }) {
  const error = data?.error as string | undefined;

  return (
    <>
      <head>
        <title>ログイン - 検証Webアプリケーション</title>
      </head>
      <div class="px-4 py-8 mx-auto min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div class="max-w-sm w-full space-y-8 bg-white p-10 rounded-xl shadow-md">
          <div>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
              アカウントにログイン
            </h2>
          </div>
          <form class="mt-8 space-y-6" method="POST">
            {error && (
              <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span class="block sm:inline">{error}</span>
              </div>
            )}
            <div class="rounded-md shadow-sm -space-y-px">
              <div>
                <label for="username" class="sr-only">ユーザー名</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="ユーザー名"
                />
              </div>
              <div>
                <label for="password" class="sr-only">パスワード</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="パスワード"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                ログイン
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
});
