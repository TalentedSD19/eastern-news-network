// One-off migration: turns a Neon (Postgres) backup into SQL for the D1 database.
//
//   1. Restore a pg_dump into a throwaway container named enn-restore (database "enn"):
//        docker run -d --name enn-restore -e POSTGRES_HOST_AUTH_METHOD=trust -e TZ=UTC \
//          -v <backup dir>:/backup:ro postgres:18
//        docker exec enn-restore createdb -U postgres enn
//        docker exec enn-restore pg_restore -U postgres -d enn --no-owner --no-privileges \
//          --schema=public /backup/<file>.dump
//   2. node scripts/neon-to-d1.mjs <out.sql>
//   3. npx wrangler d1 execute DB --remote --file <out.sql>
//
// The output replaces every row in the app tables, so it can be re-run for the final sync.
// It contains password hashes and reader data: keep it outside the repo.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const out = process.argv[2];
if (!out) throw new Error("usage: node scripts/neon-to-d1.mjs <out.sql>");

// Parents before children, so foreign keys hold while inserting.
const TABLES = ["User", "Category", "Article", "ArticleView", "ShareClick", "Comment", "Vote", "PushSubscription"];

// Column names and SQLite types, read from the D1 schema itself.
const schema = readFileSync(new URL("../prisma/migrations/0001_init.sql", import.meta.url), "utf8");
function d1Columns(table) {
  const block = schema.match(new RegExp(`CREATE TABLE "${table}" \\(([\\s\\S]*?)\\n\\);`));
  if (!block) throw new Error(`table ${table} not in 0001_init.sql`);
  return [...block[1].matchAll(/^\s+"(\w+)" (\w+)/gm)].map(([, name, type]) => ({ name, type }));
}

function rows(table) {
  const json = execFileSync(
    "docker",
    ["exec", "enn-restore", "psql", "-U", "postgres", "-d", "enn", "-At", "-c",
      `SELECT COALESCE(json_agg(t ORDER BY t.id), '[]') FROM "${table}" t`],
    { encoding: "utf8", maxBuffer: 512 * 1024 * 1024 }
  );
  return JSON.parse(json);
}

// Same text format Prisma writes to D1 (2026-03-04T21:15:00.500Z), so string
// comparisons and SQLite's date functions behave the same for migrated rows.
// Postgres "timestamp without time zone" values are UTC, as Prisma stores them.
function toD1(value, type) {
  if (value === null || value === undefined) return "NULL";
  switch (type) {
    case "DATETIME":
      return quote(new Date(`${value}Z`).toISOString());
    case "BOOLEAN":
      return value ? "1" : "0";
    case "INTEGER":
      return String(Number(value));
    case "JSONB":
      return quote(JSON.stringify(value));
    default:
      return quote(String(value));
  }
}
const quote = (s) => `'${s.replace(/'/g, "''")}'`;

const lines = ["PRAGMA defer_foreign_keys = true;"];
for (const table of [...TABLES].reverse()) lines.push(`DELETE FROM "${table}";`);

const counts = {};
for (const table of TABLES) {
  const columns = d1Columns(table);
  const data = rows(table);
  counts[table] = data.length;
  if (data.length > 0) {
    const source = Object.keys(data[0]).sort().join(",");
    const target = columns.map((c) => c.name).sort().join(",");
    if (source !== target) throw new Error(`${table}: columns differ\n  neon: ${source}\n  d1:   ${target}`);
  }
  const names = columns.map((c) => `"${c.name}"`).join(", ");
  for (const row of data) {
    lines.push(`INSERT INTO "${table}" (${names}) VALUES (${columns.map((c) => toD1(row[c.name], c.type)).join(", ")});`);
  }
}

writeFileSync(out, lines.join("\n") + "\n");
console.log(JSON.stringify(counts));
