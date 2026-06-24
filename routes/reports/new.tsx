/**
 * レポート作成ページモジュール
 * レポートの新規作成フォームの表示と登録処理を行います。
 */

import { define } from "../../utils.ts";
import db from "../../db.ts";

/**
 * レポート作成ページのハンドラ
 */
export const handler = define.handlers({
  /**
   * レポート登録処理 (POST)
   */
  async POST(ctx) {
    const form = await ctx.req.formData();
    const title = form.get("title")?.toString();
    const summary = form.get("summary")?.toString();
    const details = form.get("details")?.toString();
    const creator_id = ctx.state.user?.id;

    if (!title) {
      return ctx.render({ error: "タイトルは必須入力です。", values: { title, summary, details } });
    }

    if (!creator_id) {
      return new Response("Unauthorized", { status: 401 });
    }

    // データベースにレポートを保存
    db.prepare(
      "INSERT INTO reports (title, summary, details, creator_id) VALUES (?, ?, ?, ?)"
    ).run(title, summary, details, creator_id);

    // 登録成功後はトップページへリダイレクト
    return new Response(null, {
      status: 303,
      headers: { location: "/" },
    });
  },
});

/**
 * レポート作成ページコンポーネント
 */
export default define.page(function NewReportPage({ data }) {
  const error = data?.error as string | undefined;
  const values = data?.values || {};

  return (
    <div class="px-4 py-8 mx-auto max-w-2xl">
      <head>
        <title>新規レポート作成 - 検証Webアプリケーション</title>
      </head>
      <div class="mb-8">
        <a href="/" class="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mb-4">
          <span>← レポート一覧に戻る</span>
        </a>
        <h1 class="text-3xl font-bold text-gray-900">新規レポート作成</h1>
      </div>

      <div class="bg-white shadow sm:rounded-lg p-6">
        <form method="POST" class="space-y-6">
          {error && (
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span class="block sm:inline">{error}</span>
            </div>
          )}

          <div>
            <label for="title" class="block text-sm font-medium text-gray-700">
              タイトル <span class="text-red-500">*</span>
            </label>
            <div class="mt-1">
              <input
                type="text"
                name="title"
                id="title"
                required
                value={values.title}
                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                placeholder="レポートのタイトルを入力"
              />
            </div>
          </div>

          <div>
            <label for="summary" class="block text-sm font-medium text-gray-700">
              概要
            </label>
            <div class="mt-1">
              <textarea
                id="summary"
                name="summary"
                rows={3}
                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                placeholder="レポートの概要を簡潔に入力"
              >{values.summary}</textarea>
            </div>
          </div>

          <div>
            <label for="details" class="block text-sm font-medium text-gray-700">
              詳細
            </label>
            <div class="mt-1">
              <textarea
                id="details"
                name="details"
                rows={10}
                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                placeholder="レポートの詳細内容を入力"
              >{values.details}</textarea>
            </div>
          </div>

          <div class="flex justify-end">
            <button
              type="submit"
              class="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              登録する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
