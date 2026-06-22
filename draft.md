検証Webアプリケーション

## 技術スタック
* deno
* fresh
* tailwind.css
* sqlite

## 実装計画
* Step1 基本構成とHello worldの表示
* Step2 テストコードの作成
* Step3 DBの接続とログイン画面と実装
* Step4 レポート入力画面の実装
* Step5 PDFのダウンロード機能の実装

## テスト計画
* denoのプロジェクトとして標準的なテストコードを作成してgithub actionsによる実行
* Playwright(docker)を使用して github actionsによる自動テスト

## ユーザーテーブル
* ユーザーID
* ユーザー名
* パスワード(ハッシュ化)
* メールアドレス

## レポート項目
* タイトル
* 作成日時
* 作成者
* 概要
* 詳細

## PDFフォーマット
* A4縦
* ページ罫線あり
