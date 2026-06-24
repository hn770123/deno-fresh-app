import { type ComponentChildren } from "preact";
import { Head } from "fresh/runtime";
import { type State } from "../utils/fresh.ts";

/**
 * レイアウトコンポーネントのプロパティ
 */
export interface LayoutProps {
  title?: string;
  state?: State;
  children: ComponentChildren;
}

/**
 * アプリケーションの共通レイアウトコンポーネント
 */
export default function Layout({ title, state, children }: LayoutProps) {
  const pageTitle = title ? `${title} - 検証Webアプリ` : "検証Webアプリ";

  return (
    <div class="min-h-screen bg-gray-50">
      <Head>
        <title>{pageTitle}</title>
      </Head>

      {/* ヘッダー/ナビゲーション */}
      <nav class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex">
              <div class="flex-shrink-0 flex items-center">
                <a href="/" class="text-xl font-bold text-indigo-600">検証Webアプリ</a>
              </div>
            </div>
            {state?.user && (
              <div class="flex items-center gap-4">
                <span class="text-sm text-gray-600">
                  ようこそ <span class="font-semibold text-gray-900">{state.user.username}</span> さん
                </span>
                <a
                  href="/login"
                  class="text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  ログアウト
                </a>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main class="py-10">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* フッター */}
      <footer class="bg-white border-t mt-auto">
        <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p class="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} 検証Webアプリケーション
          </p>
        </div>
      </footer>
    </div>
  );
}
