import { headers } from "next/headers";

import { db } from "@/lib/db";

/**
 * Which fixed window a moment falls in, and when that window ends. Windows are aligned to
 * the clock (a 10-minute limit resets at :00, :10, :20…), so the window number can be part
 * of the row's key.
 */
export function rateLimitWindow(nowMs: number, windowSeconds: number) {
  const windowMs = windowSeconds * 1000;
  const index = Math.floor(nowMs / windowMs);
  return { index, expiresAt: new Date((index + 1) * windowMs) };
}

/**
 * Fixed-window rate limit stored in the database (shared by every serverless instance), in
 * its own table. Returns false when the caller is over the limit.
 *
 * Counting is a single atomic statement: requests arriving at the same time each get a
 * different count, so a burst cannot slip through between a read and a write.
 */
export async function consumeRateLimit(key: string, max: number, windowSeconds: number) {
  const now = Date.now();
  const { index, expiresAt } = rateLimitWindow(now, windowSeconds);
  const bucketKey = `${key}:${index}`;

  let count: number;
  try {
    ({ count } = await db.rateLimitBucket.upsert({
      where: { key: bucketKey },
      create: { key: bucketKey, count: 1, expiresAt },
      update: { count: { increment: 1 } },
      select: { count: true },
    }));
  } catch (error) {
    // Two first requests of a window raced to create the row: this one lost, so it counts
    // on the row the other one created.
    if ((error as { code?: string }).code !== "P2002") throw error;
    ({ count } = await db.rateLimitBucket.update({
      where: { key: bucketKey },
      data: { count: { increment: 1 } },
      select: { count: true },
    }));
  }

  // First request of a window: a cheap moment to drop the windows that already ended.
  if (count === 1) {
    await db.rateLimitBucket.deleteMany({ where: { expiresAt: { lt: new Date(now) } } });
  }
  return count <= max;
}

/**
 * What a limit counts for one client address. An IPv6 customer controls a whole /64 block
 * (2^64 addresses) and can change address on every request, so the block is counted, not
 * each address. IPv4 addresses, and IPv4 written inside IPv6, are counted as they are.
 */
export function rateLimitClient(ip: string): string {
  const address = ip.trim().toLowerCase();
  if (!address.includes(":")) return address;

  const [head = "", tail] = address.split("::");
  const headGroups = head ? head.split(":") : [];
  const tailGroups = tail ? tail.split(":") : [];
  const last = tailGroups.at(-1) ?? headGroups.at(-1) ?? "";
  if (last.includes(".")) return last; // "::ffff:203.0.113.7"

  const zeros = tail === undefined ? 0 : Math.max(0, 8 - headGroups.length - tailGroups.length);
  const groups = [...headGroups, ...Array<string>(zeros).fill("0"), ...tailGroups];
  const block = groups.slice(0, 4).map((group) => group.replace(/^0+(?=.)/, ""));
  return `${block.join(":")}::/64`;
}

/** Client as reported by Vercel's proxy (first x-forwarded-for entry), ready to use as a key. */
export async function clientIp(): Promise<string> {
  const list = await headers();
  const ip = list.get("x-forwarded-for")?.split(",")[0]?.trim() || list.get("x-real-ip");
  return ip ? rateLimitClient(ip) : "unknown";
}
