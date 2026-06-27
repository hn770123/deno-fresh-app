FROM denoland/deno:2.1.4

# IPAゴシックフォントのインストール（PDF生成用）
RUN apt-get update && apt-get install -y \
    fonts-ipafont-gothic \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 依存関係のキャッシュ
# nodeModulesDir: manual のため、deno install が必要
COPY deno.json deno.lock ./
RUN deno install

# ソースコードのコピー
COPY . .

# プロダクションビルドの実行
RUN deno task build

# 実行ユーザーの変更（セキュリティのため）
# 権限が必要な場合は適宜調整
# USER deno

EXPOSE 8000

# アプリケーションの起動
CMD ["deno", "task", "start"]
