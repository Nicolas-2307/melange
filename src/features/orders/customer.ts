import { db } from "@/lib/db";

/**
 * Orders placed while signed in with this account (orders.userId).
 *
 * Guest orders with the same email are NOT included: anyone can register an address they
 * don't own, so matching by email would expose other people's orders (address, phone).
 */
export async function listOrdersForUser(userId: string) {
  return db.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      number: true,
      status: true,
      publicToken: true,
      fulfillmentType: true,
      deliveryDate: true,
      total: true,
      createdAt: true,
      _count: { select: { items: true } },
    },
  });
}

export type CustomerOrderRow = Awaited<ReturnType<typeof listOrdersForUser>>[number];
