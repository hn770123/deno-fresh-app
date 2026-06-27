# デプロイ・起動ガイド

本リポジトリのアプリケーションを各環境で起動する手順について説明します。

## 1. GitHub Codespaces で動かす手順

1. GitHub リポジトリのページで 「Code」 ボタンをクリックし、「Codespaces」 タブを選択します。
2. 「Create codespace on main」 をクリックします。
3. Codespace が立ち上がると、自動的に Deno 環境がセットアップされます。
4. ターミナルで以下のコマンドを実行して、開発サーバーを起動します。
   ```bash
   deno task dev
   ```
5. ポート 5173 がフォワードされるので、ブラウザで開きます。

## 2. VS Code の Dev Container で動かす手順

1. ローカルに [Docker Desktop](https://www.docker.com/products/docker-desktop/) がインストールされ、実行されていることを確認します。
2. VS Code に 「Dev Containers」 拡張機能をインストールします。
3. リポジトリをローカルにクローンし、VS Code で開きます。
4. 左下の緑色のアイコン（または `F1` キーを押して `Dev Containers: Reopen in Container`）をクリックします。
5. コンテナのビルドが完了すると、コンテナ内の環境で開発が可能です。
6. ターミナルで以下のコマンドを実行します。
   ```bash
   deno task dev
   ```

## 3. 一般的な VPC (Linux) で Docker で動かす手順

Linux サーバー上で Docker および Docker Compose を使用してデプロイする手順です。

### 準備
- Docker および Docker Compose がインストールされていること。

### 手順
1. リポジトリをサーバー上にクローンします。
   ```bash
   git clone <repository-url>
   cd <repository-name>
   ```
2. Docker Compose を使用してイメージをビルドし、起動します。
   ```bash
   docker compose up -d --build
   ```
   - `--build` フラグにより、`Dockerfile` に基づいてイメージがビルドされます。
   - `-d` フラグにより、バックグラウンドで実行されます。
3. アプリケーションはデフォルトで `8000` ポートで待ち受けます。
4. 必要に応じて、Nginx 等のリバースプロキシを設定し、ポート 80/443 から 8000 へ転送するように設定してください。

### 注意事項
- PDF生成機能を使用するために、`Dockerfile` 内で IPAゴシックフォントをインストールしています。
- データベースは SQLite (`app.db`) を使用しています。永続化が必要な場合は、`compose.yaml` のボリューム設定を確認してください。
