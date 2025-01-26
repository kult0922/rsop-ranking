# Welcome to RSOP Ranking!

The visualizer for poker players

## Development

You will be utilizing Wrangler for local development to emulate the Cloudflare runtime. This is already wired up in your package.json as the `dev` script:

### 1. install libs

```
npm install
```

### 2. database setup

`--local` をつけないと、cloudflare 環境に反映されるので注意

マイグレーション

```sh
npx wrangler d1 migrations apply rsop --local
```

マイグレーションをリセットしたいときは以下

```sh
npx wrangler d1 execute rsop --local --command="DELETE FROM d1_migrations;"
```

初期データ

```sh
npx wrangler d1 execute rsop --local --file=./seed.sql
```

### 3. start the remix dev server and wrangler

```sh
# start the remix dev server and wrangler
npm install
npm run dev
```

Open up [http://127.0.0.1:8788](http://127.0.0.1:8788) and you should be ready to go!

## add season

local

```sh
npx wrangler d1 execute rsop --local --command="INSERT INTO seasons (name) VALUES ('season_name');"
```

prod
please insert row from cloudflare console

### migration

crete migration file

ローカルで実行したいときは`--local`をつける

```
npx wrangler d1 migrations create rsop {migratin_file_name}
```

edit migration file, then

```
npx wrangler d1 migrations apply rsop
```
