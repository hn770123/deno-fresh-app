/**
 * メインルートモジュール
 * このモジュールは、レポート一覧を表示するホームページを定義します。
 */

import { define } from "../utils.ts";
import db from "../db.ts";

/**
 * ホームページコンポーネント
 * データベースからレポート一覧を取得して表示します。
 */
export default define.page(function Home({ state }) {
  // データベースから全レポートを、作成者名を含めて取得
  const reports = db.prepare(`
    SELECT r.id, r.title, r.created_at, u.username as creator_name
    FROM reports r
    JOIN users u ON r.creator_id = u.id
    ORDER BY r.created_at DESC
  `).all() as { id: number; title: string; created_at: string; creator_name: string }[];

  return (
    <div class="px-4 py-8 mx-auto max-w-4xl">
      <head>
        <title>レポート一覧 - 検証Webアプリケーション</title>
      </head>
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">レポート一覧</h1>
        <div class="flex items-center gap-4">
          <span class="text-gray-600">ようこそ <span class="font-semibold">{state.user?.username}</span> さん</span>
          <a
            href="/reports/new"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            新規作成
          </a>
        </div>
      </div>

      <div class="bg-white shadow overflow-hidden sm:rounded-lg">
        <ul class="divide-y divide-gray-200">
          {reports.length === 0 ? (
            <li class="px-4 py-12 text-center text-gray-500">
              <p class="text-lg">レポートがまだありません。</p>
              <p class="mt-2">「新規作成」ボタンから最初のレポートを作成しましょう。</p>
            </li>
          ) : (
            reports.map((report) => (
              <li key={report.id} class="hover:bg-gray-50 transition-colors">
                <div class="px-4 py-4 sm:px-6">
                  <div class="flex items-center justify-between">
                    <h2 class="text-lg font-medium text-indigo-600 truncate">
                      {report.title}
                    </h2>
                    <div class="ml-2 flex-shrink-0 flex">
                      <p class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        作成者: {report.creator_name}
                      </p>
                    </div>
                  </div>
                  <div class="mt-2 sm:flex sm:justify-between">
                    <div class="sm:flex">
                      <p class="flex items-center text-sm text-gray-500">
                        作成日時: {new Date(report.created_at).toLocaleString('ja-JP')}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
});
