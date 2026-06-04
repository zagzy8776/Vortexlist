import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { FiveSimPublicError, getFiveSimDelivery, getFiveSimOrder } from "@/lib/providers/fivesim";
import { SmsManPublicError, getSmsManDelivery, getSmsManOrder } from "@/lib/providers/sms-man";
import { prisma } from "@/lib/prisma";

type NumberOrderMeta = {
  provider?: string;
  supplierOrder?: { id?: number };
  product?: {
    id?: string;
    name?: string;
    country?: string;
    type?: string;
  };
};

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session?.user) {
    return NextResponse.json({ message: "Please sign in to refresh SMS status." }, { status: 401 });
  }

  const body = (await request.json()) as { orderId?: string };
  const orderId = body.orderId?.trim();

  if (!orderId) {
    return NextResponse.json({ message: "Order is required." }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId: session.user.id,
    },
  });

  const meta = order?.providerMeta as NumberOrderMeta | null;
  const supplierOrderId = meta?.supplierOrder?.id;

  if (!order || !["5sim", "sms-man"].includes(meta?.provider ?? "") || !supplierOrderId) {
    return NextResponse.json({ message: "Phone number order is not refreshable." }, { status: 404 });
  }

  try {
    const refreshResult = meta?.provider === "sms-man"
      ? await getSmsManOrder(supplierOrderId).then((smsManOrder) => ({
          supplierOrder: smsManOrder,
          delivery: getSmsManDelivery(smsManOrder, { service: meta.product?.name }),
        }))
      : await getFiveSimOrder(supplierOrderId).then((fiveSimOrder) => ({
          supplierOrder: fiveSimOrder,
          delivery: getFiveSimDelivery(fiveSimOrder),
        }));

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: refreshResult.delivery.sms.length > 0 ? "FULFILLED" : order.status,
        providerMeta: {
          provider: meta.provider,
          supplierOrder: JSON.parse(JSON.stringify(refreshResult.supplierOrder)),
          product: meta.product,
          delivery: JSON.parse(JSON.stringify(refreshResult.delivery)),
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof FiveSimPublicError || error instanceof SmsManPublicError ? error.message : "Unable to refresh SMS delivery right now.";

    return NextResponse.json({ message }, { status: 502 });
  }
}