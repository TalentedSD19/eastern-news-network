import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@/lib/prisma-runtime";

// The D1 binding only exists inside a request (or `next dev`, via
// initOpenNextCloudflareForDev), so the client is created lazily from it and
// reused for as long as the Worker keeps the same binding object.
const clients = new WeakMap<object, PrismaClient>();

function getClient(): PrismaClient {
  const { env } = getCloudflareContext();
  let client = clients.get(env.DB);
  if (!client) {
    client = new PrismaClient({ adapter: new PrismaD1(env.DB), log: ["error"] });
    clients.set(env.DB, client);
  }
  return client;
}

// Stands in for any client property when there's no Cloudflare context — e.g. a
// statically prerendered page at build time. Every call returns a rejected promise,
// so callers' existing `.catch()` fallbacks still apply instead of the build crashing.
function unavailable(error: unknown): never {
  const reject = () => Promise.reject(error);
  return new Proxy(reject, { get: () => unavailable(error) }) as never;
}

// D1 rejects any query with more than 100 bound parameters, and Prisma doesn't split
// every query's IN list (groupBy, deleteMany, raw SQL) to fit. Run such queries over
// these chunks and combine the results.
const MAX_IN_LIST = 90;
export function inChunks<T>(items: T[]): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += MAX_IN_LIST) chunks.push(items.slice(i, i + MAX_IN_LIST));
  return chunks;
}

// Same API as a PrismaClient (`prisma.article.findMany(...)`), resolved per request.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    let client: PrismaClient;
    try {
      client = getClient();
    } catch (error) {
      return unavailable(error);
    }
    const value = Reflect.get(client, property);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
