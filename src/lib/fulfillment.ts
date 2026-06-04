import type { Prisma } from "@prisma/client";
import { FiveSimPublicError, getFiveSimDelivery, getFiveSimOrder } from "./providers/fivesim";
import { IPRoyalPublicError, getIPRoyalDelivery, getIPRoyalOrder } from "./providers/iproyal";
import { ProxySellerPublicError, getProxySellerDelivery } from "./providers/proxy-seller";
import { prisma } from "./prisma";

type StoredOrderMeta = {
  provider?: string;
  supplierOrder?: {
    id?: number;
    orderId?: number;
  };
  product?: {
    id?: string;
    name?: string;
    country?: string;
    type?: string;
  };
  delivery?: unknown;
};

type FulfillmentResult = {
  checked: number;
  fulfilled: number;
  stillPending: number;
  failed: number;
};

function jsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function processPendingFulfillments(limit = 25): Promise<FulfillmentResult> {
  const orders = await prisma.order.findMany({
    where: { status: "FULFILLING" },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  const result: FulfillmentResult = {
    checked: orders.length,
    fulfilled: 0,
    stillPending: 0,
    failed: 0,
  };

  for (const order of orders) {
    const meta = order.providerMeta as StoredOrderMeta | null;

    try {
      if (meta?.provider === "5sim" && meta.supplierOrder?.id) {
        const supplierOrder = await getFiveSimOrder(meta.supplierOrder.id);
        const delivery = getFiveSimDelivery(supplierOrder);
        const fulfilled = delivery.sms.length > 0;

        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: fulfilled ? "FULFILLED" : "FULFILLING",
            providerMeta: jsonValue({
              provider: "5sim",
              supplierOrder,
              product: meta.product,
              delivery,
            }),
          },
        });

        if (fulfilled) {
          result.fulfilled++;
        } else {
          result.stillPending++;
        }
        continue;
      }

      if (meta?.provider === "proxy-seller" && meta.supplierOrder?.orderId) {
        const delivery = await getProxySellerDelivery(meta.supplierOrder.orderId);
        const fulfilled = delivery.length > 0;

        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: fulfilled ? "FULFILLED" : "FULFILLING",
            providerMeta: jsonValue({
              ...meta,
              delivery,
            }),
          },
        });

        if (fulfilled) {
          result.fulfilled++;
        } else {
          result.stillPending++;
        }
        continue;
      }

      if (meta?.provider === "iproyal" && meta.supplierOrder?.id) {
        const supplierOrder = await getIPRoyalOrder(meta.supplierOrder.id);
        const delivery = getIPRoyalDelivery(supplierOrder);
        const fulfilled = delivery.length > 0;

        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: fulfilled ? "FULFILLED" : "FULFILLING",
            providerMeta: jsonValue({
              provider: "iproyal",
              supplierOrder,
              product: meta.product,
              delivery,
            }),
          },
        });

        if (fulfilled) {
          result.fulfilled++;
        } else {
          result.stillPending++;
        }
        continue;
      }

      result.stillPending++;
    } catch (error) {
      if (error instanceof FiveSimPublicError || error instanceof ProxySellerPublicError || error instanceof IPRoyalPublicError) {
        result.stillPending++;
      } else {
        result.failed++;
        console.error("Fulfillment worker failed for order", order.id, error);
      }
    }
  }

  return result;
}