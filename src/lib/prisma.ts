import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Neon's serverless compute auto-suspends when idle, so the first query
// after a quiet period can fail to connect (P1001) while it wakes up.
// Retrying with a short backoff rides out that wake-up instead of failing.
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 500
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const isConnectionError =
      error instanceof Prisma.PrismaClientInitializationError ||
      (error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P1001");

    if (!isConnectionError || retries <= 0) throw error;

    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return withDbRetry(fn, retries - 1, delayMs * 2);
  }
}
