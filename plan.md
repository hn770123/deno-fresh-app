# テスト失敗の調査報告と対策

## 1. 調査結果
`test-result.log` および GitHub Actions の実行ログを確認したところ、以下の3つの問題によりテストが失敗していることが判明しました。

### 問題A: 型エラーによるビルド失敗
**エラー内容:**
`TS2322 [ERROR]: Type 'Uint8Array<ArrayBufferLike>' is not assignable to type 'BufferSource'.`
(場所: `auth_utils.ts:29:7`)

**原因:**
`auth_utils.ts` の `hashPassword` 関数内で、`crypto.getRandomValues` が `SharedArrayBuffer` をバックエンドに持つ `Uint8Array` を返すことがあり、これが `crypto.subtle.deriveBits` の期待する `BufferSource` (標準の `ArrayBuffer`) と型不整合を起こしていました。

### 問題B: ランタイムエラー (GLIBC バージョン不足)
**エラー内容:**
`Error: Could not open library: /lib/x86_64-linux-gnu/libm.so.6: version 'GLIBC_2.38' not found`

**原因:**
GitHub Actions で使用していたコンテナイメージ `playwright:v1.45.0-jammy` (Ubuntu 22.04 ベース) に含まれる GLIBC のバージョンが古く、`@db/sqlite` が要求する最新の SQLite3 動的ライブラリが動作しませんでした。

### 問題C: E2Eテストの起動タイムアウト
**エラー内容:**
`Error: サーバーの起動に失敗しました。` (30秒のタイムアウト)

**原因:**
E2Eテストは本番モードのサーバー (`_fresh/server.js`) を使用して実行されますが、GitHub Actions のワークフローにビルドステップ (`deno task build`) が不足していたため、サーバーの起動に必要なファイルが見つからず、起動に失敗していました。

## 2. 対策

### 対策A: 型エラーの解消
`auth_utils.ts` において、`salt` 変数を渡す際に `.slice()` メソッドを適用します。これにより、常に標準の `ArrayBuffer` をバックエンドに持つ新しい `Uint8Array` が作成され、型エラーが解消されます。

### 対策B: コンテナイメージの更新
`.github/workflows/test.yml` において、コンテナイメージを `v1.61.0-noble` (Ubuntu 24.04 ベース) に更新します。これにより、`GLIBC_2.38` 以上が提供され、SQLite3 ライブラリが正常に動作するようになります。

### 対策C: ビルドステップの追加
`.github/workflows/test.yml` において、`deno task test` の前に `deno task build` を実行するステップを追加しました。これにより、E2Eテストに必要な本番用成果物が確実に生成されます。

### 対策D: E2Eテストの安定化
`tests/e2e_test.ts` において、サーバーの起動待機処理を `stdout` の解析から HTTP ポーリング方式に変更しました。これにより、標準出力のバッファ詰まりによるハングアップを防止し、確実に起動を確認できるようになります。

## 3. メリットとデメリット

### メリット
- **型安全性の確保**: TypeScript の型エラーを解消し、CI パイプラインを正常化できます。
- **実行環境の近代化**: Ubuntu 24.04 ベースのイメージに移行することで、最新のライブラリ依存関係に対応できます。
- **CI ワークフローの完全性**: 必要なビルドステップを含めることで、本番環境に近い状態でのテストが可能になります。
- **テストの信頼性向上**: ポーリング方式の採用により、E2E テストが環境の差異に左右されず安定して動作します。

### デメリット
- **CI 実行時間の僅かな増加**: ビルドステップの追加により、数秒から十数秒程度の実行時間増加が発生しますが、正確なテスト実行のために不可欠なコストです。
- **微小なオーバーヘッド**: `salt.slice()` によるメモリコピーが発生しますが、サイズが小さいためパフォーマンスへの影響は無視できます。
