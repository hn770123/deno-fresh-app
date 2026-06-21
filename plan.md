# テスト失敗の調査報告と対策

## 1. 調査結果
`test-result.log` を確認したところ、GitHub Actions 上でのテスト実行時に以下の型エラーが発生し、テストが中断していることが判明しました。

**エラー内容:**
`TS2322 [ERROR]: Type 'Uint8Array<ArrayBufferLike>' is not assignable to type 'BufferSource'.`
(場所: `auth_utils.ts:29:7`)

**原因:**
`auth_utils.ts` の `hashPassword` 関数内で、`crypto.getRandomValues` を使用して生成された `salt` (Uint8Array) が `crypto.subtle.deriveBits` に渡されています。
Deno の一部の環境やバージョンにおいて、`crypto.getRandomValues` は `SharedArrayBuffer` をバックエンドに持つ `Uint8Array` を返すことがあり、これが `crypto.subtle.deriveBits` が期待する `BufferSource` (標準の `ArrayBuffer` を要求) と型レベルで不整合を起こしています。

## 2. 対策
`salt` 変数を `crypto.subtle.deriveBits` に渡す際に、`.slice()` メソッドを適用します。

```typescript
const derivedBits = await crypto.subtle.deriveBits(
  {
    name: "PBKDF2",
    salt: salt.slice(), // ここを修正
    iterations: 100000,
    hash: "SHA-256",
  },
  // ...
);
```

`Uint8Array.prototype.slice()` は、元の配列の内容をコピーした新しい `Uint8Array` を作成します。この新しい配列は常に標準の `ArrayBuffer` をバックエンドに持つため、型エラーが解消されます。

## 3. メリットとデメリット

### メリット
- **型安全性の確保**: TypeScript の型エラーを確実に解消し、CI パイプラインを正常化できます。
- **環境互換性**: `SharedArrayBuffer` を利用する環境とそうでない環境の両方で、確実に動作するコードになります。
- **実装の容易さ**: 既存のロジックを大幅に変更することなく、1行の修正で対応可能です。

### デメリット
- **微小なオーバーヘッド**: 新しいメモリ領域の確保とデータのコピーが発生しますが、ソルトのサイズ（通常 16バイト程度）であればパフォーマンスへの影響は無視できるレベルです。
