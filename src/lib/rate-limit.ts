import { headers } from "next/headers";

import { db } from "@/lib/db";

/**
 * Fixed-window rate limit stored in the database (shared by every serverless instance).
 * Reuses Better Auth's `rate_limits` table with our own key prefixes ("checkout:", "cart:").
 * Returns false when the caller is over the limit.
 */
export async function consumeRateLimit(key: string, max: number, windowSeconds: number) {
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;
  const existing = await db.rateLimit.findUnique({ where: { key } });

  if (!existing || Number(existing.lastRequest) < windowStart) {
    // New window: start counting from 1 (lastRequest marks the window start).
    await db.rateLimit.upsert({
      where: { key },
      update: { count: 1, lastRequest: BigInt(now) },
      create: { id: crypto.randomUUID(), key, count: 1, lastRequest: BigInt(now) },
    });
    return true;
  }
  if (existing.count >= max) return false;

  await db.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
  return true;
}

/** Client IP as reported by Vercel's proxy (first x-forwarded-for entry). */
export async function clientIp(): Promise<string> {
  const list = await headers();
  return list.get("x-forwarded-for")?.split(",")[0]?.trim() || list.get("x-real-ip") || "unknown";
}
