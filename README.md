# Eastern News Network

The news site at [easternnewsnetwork.com](https://easternnewsnetwork.com): a Next.js 15 app
running on Cloudflare Workers through the [OpenNext adapter](https://opennext.js.org/cloudflare).

| Piece | Where it lives |
|---|---|
| App | Cloudflare Worker `eastern-news-network` |
| Database | Cloudflare D1 `eastern-news-network` (SQLite, via Prisma's D1 adapter) |
| Images | R2 bucket `article-images`, served from its public `r2.dev` URL |
| Domain / DNS | Cloudflare (registered through Vercel) |

## Local development

```sh
npm install
npx wrangler login                              # the R2 bucket is remote even in dev
npx wrangler d1 migrations apply DB --local     # create the local D1 database
npm run seed                                    # admin@ / editor@easternnewsnetwork.com
npm run dev
```

`npm run dev` reads D1 and R2 through `getCloudflareContext()`; the database is a local
SQLite copy, while image uploads go to the real bucket. `npm run preview` runs the production
build in the Workers runtime locally.

## Environment and secrets

The Cloudflare build bundles every value in `.env*` files into the Worker, so they must
never hold secrets.

- `.env`: public values only (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `R2_PUBLIC_URL`).
- `.env.development.local`: dev-only `NEXTAUTH_SECRET` and `NEXTAUTH_URL`.
- Production secrets are Worker secrets: `npx wrangler secret put NEXTAUTH_SECRET`,
  `npx wrangler secret put VAPID_PRIVATE_KEY`.
- Other production settings are `vars` in `wrangler.jsonc`.

## Deploying

Merging to `main` triggers Cloudflare Workers Builds, which runs
`npx opennextjs-cloudflare build` and `npx opennextjs-cloudflare deploy`.
`npm run deploy` does the same from a local checkout.

## Database changes

Migrations are plain SQL files in `prisma/migrations`, applied by Wrangler:

```sh
# after editing prisma/schema.prisma: diff the last committed schema against the new one
git show HEAD:prisma/schema.prisma > /tmp/schema.before.prisma
npx prisma migrate diff --from-schema-datamodel /tmp/schema.before.prisma \
  --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0002_describe_change.sql
npx wrangler d1 migrations apply DB --local     # try it locally
npx wrangler d1 migrations apply DB --remote    # then production
```

D1 rejects queries with more than 100 bound parameters, so run queries with long `IN`
lists through `inChunks()` from `src/lib/prisma.ts`.
