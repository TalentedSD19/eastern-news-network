// Prisma's Workers build. Imported by path because the Cloudflare adapter's bundler
// resolves plain "@prisma/client" to the Node build, which reads its query compiler
// from disk; this one imports the .wasm as a module instead.
// `next dev` runs on Node and swaps in prisma-runtime.node.ts (see next.config.mjs).
export { Prisma, PrismaClient } from "@prisma/client/wasm";
