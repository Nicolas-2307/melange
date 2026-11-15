import { beforeEach, describe, expect, it, vi } from "vitest";

// In-memory stand-in for the `rate_limit_buckets` table.
const rows = new Map<string, { count: number; expiresAt: Date }>();
const bucket = {
  upsert: vi.fn(
    async ({ where, create }: { where: { key: string }; create: { expiresAt: Date } }) => {
      const row = rows.get(where.key);
      if (row) row.count += 1;
      else rows.set(where.key, { count: 1, expiresAt: create.expiresAt });
      return { count: rows.get(where.key)!.count };
    },
  ),
  update: vi.fn(async ({ where }: { where: { key: string } }) => {
    const row = rows.get(where.key)!;
    row.count += 1;
    return { count: row.count };
  }),
  deleteMany: vi.fn(async ({ where }: { where: { expiresAt: { lt: Date } } }) => {
    for (const [key, row] of rows) if (row.expiresAt < where.expiresAt.lt) rows.delete(key);
    return { count: 0 };
  }),
};

vi.mock("@/lib/db", () => ({ db: { rateLimitBucket: bucket } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

const { consumeRateLimit, rateLimitWindow } = await import("@/lib/rate-limit");

beforeEach(() => {
  rows.clear();
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("rateLimitWindow", () => {
  it("alinea las ventanas con el reloj", () => {
    const at = (iso: string) => rateLimitWindow(Date.parse(iso), 600);
    expect(at("2026-11-15T10:03:00Z").index).toBe(at("2026-11-15T10:09:59Z").index);
    expect(at("2026-11-15T10:10:00Z").index).toBe(at("2026-11-15T10:03:00Z").index + 1);
    expect(at("2026-11-15T10:03:00Z").expiresAt.toISOString()).toBe("2026-11-15T10:10:00.000Z");
  });
});

describe("consumeRateLimit", () => {
  it("deja pasar hasta el máximo y bloquea el resto, aunque lleguen a la vez", async () => {
    const results = await Promise.all(
      Array.from({ length: 12 }, () => consumeRateLimit("checkout:1.2.3.4", 5, 600)),
    );
    expect(results.filter(Boolean)).toHaveLength(5);
    expect(await consumeRateLimit("checkout:1.2.3.4", 5, 600)).toBe(false);
  });

  it("cuenta cada cliente por separado", async () => {
    for (let i = 0; i < 5; i++) await consumeRateLimit("checkout:1.2.3.4", 5, 600);
    expect(await consumeRateLimit("checkout:5.6.7.8", 5, 600)).toBe(true);
  });

  it("empieza de cero en la ventana siguiente y borra las ventanas vencidas", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-15T10:03:00Z"));
    for (let i = 0; i < 6; i++) await consumeRateLimit("checkout:1.2.3.4", 5, 600);
    expect(await consumeRateLimit("checkout:1.2.3.4", 5, 600)).toBe(false);

    vi.setSystemTime(new Date("2026-11-15T10:10:01Z"));
    expect(await consumeRateLimit("checkout:1.2.3.4", 5, 600)).toBe(true);
    expect(rows.size).toBe(1);
  });

  it("si dos primeras peticiones chocan al crear la fila, la segunda igual cuenta", async () => {
    const key = `cart:9.9.9.9:${rateLimitWindow(Date.now(), 3600).index}`;
    rows.set(key, { count: 1, expiresAt: new Date(Date.now() + 1000) });
    bucket.upsert.mockRejectedValueOnce(Object.assign(new Error("unique"), { code: "P2002" }));

    expect(await consumeRateLimit("cart:9.9.9.9", 20, 3600)).toBe(true);
    expect(bucket.update).toHaveBeenCalledOnce();
    expect(rows.get(key)?.count).toBe(2);
  });
});
