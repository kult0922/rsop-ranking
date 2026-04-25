
## プロジェクト概要

RSOP Ranking — ポーカープレイヤーのランキング・成績可視化 Web アプリ。

- **フレームワーク**: Remix (v2) + Cloudflare Pages
- **データベース**: Cloudflare D1 (SQLite)
- **スタイリング**: Tailwind CSS + shadcn/ui (Radix UI)
- **デプロイ**: Cloudflare Pages + Wrangler

## 開発環境のセットアップ

```sh
npm install

# ローカル DB マイグレーション（--local を必ずつける）
npx wrangler d1 migrations apply rsop --local

# 初期データ投入
npx wrangler d1 execute rsop --local --file=./seed.sql

# 開発サーバー起動
npm run dev
```


## よく使うコマンド

```sh
npm run build       # ビルド
npm run lint        # ESLint
npm run typecheck   # TypeScript 型チェック
```

### DB 操作（ローカル）

```sh
# シーズン追加
npx wrangler d1 execute rsop --local --command="INSERT INTO seasons (name) VALUES ('season_name');"

# マイグレーションリセット
npx wrangler d1 execute rsop --local --command="DELETE FROM d1_migrations;"

# マイグレーションファイル作成
npx wrangler d1 migrations create rsop {migration_file_name}
```

> **注意**: `--local` を省略すると Cloudflare 本番環境に反映される。

## データモデル

| テーブル | 主なカラム |
|----------|-----------|
| users | id, name |
| seasons | id, name |
| games | id, season_id, name, date |
| bb_change | id, value, user_id, game_id |

## シーズン管理

現在のシーズンは `app/constant.ts` の `CURRENT_SEASON` で管理する。

新シーズン追加時:
1. Cloudflare Console または wrangler コマンドで `seasons` テーブルに行を追加
2. `app/constant.ts` の `CURRENT_SEASON` を更新

## デプロイ

Cloudflare Pages へのデプロイは git push で自動実行される（CI/CD 設定済み）。
本番 DB の変更は Cloudflare Console から行う（`--local` なしの wrangler コマンドも可）。
