// Bindings declared in wrangler.jsonc, merged into the CloudflareEnv interface that
// @opennextjs/cloudflare's getCloudflareContext() returns. Written by hand rather than
// with `wrangler types`, whose runtime types replace the DOM fetch/Response types that
// the browser code relies on. Keep in sync with wrangler.jsonc.
interface CloudflareEnv {
  DB: import("@cloudflare/workers-types").D1Database;
}
