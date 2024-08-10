# Welcome to RSOP Ranking!

The visualizer for poker players

## Development

You will be utilizing Wrangler for local development to emulate the Cloudflare runtime. This is already wired up in your package.json as the `dev` script:

```sh
# start the remix dev server and wrangler
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

```
npx wrangler d1 migrations create rsop {migratin_file_name}
```

edit migration file, then

```
npx wrangler d1 migrations apply rsop
```
