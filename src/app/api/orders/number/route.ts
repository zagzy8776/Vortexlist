import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { getNumberPriceKobo, getPublicNumberCatalog } from "@/lib/catalog";
import { FiveSimPublicError, createFiveSimOrder, getFiveSimDelivery, getFiveSimOrderPartsFromProductId, isFiveSimProductId } from "@/lib/providers/fivesim";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session?.user) {
    return NextResponse.json({ message: "Please sign in to place an order." }, { status: 401 });
  }

  const body = (await request.json()) as { productId?: string };
  const productId = body.productId?.trim();

  if (!productId) {
    return NextResponse.json({ message: "Product is required." }, { status: 400 });
  }

  const products = await getPublicNumberCatalog();
  const product = products.find((item) => item.id === productId);

  if (!product?.countryCode) {
    return NextResponse.json({ message: "Phone number product is not available right now." }, { status: 404 });
  }

  if (!product.orderable || product.availability === "Unavailable") {
    return NextResponse.json({ message: "This phone number product is not orderable right now." }, { status: 400 });
  }

  const priceKobo = getNumberPriceKobo(product);

  if (!priceKobo) {
    return NextResponse.json({ message: "Phone number pricing is not configured yet." }, { status: 400 });
  }

  const fiveSimOrderParts = isFiveSimProductId(product.id) ? getFiveSimOrderPartsFromProductId(product.id) : null;

  if (!fiveSimOrderParts) {
    return NextResponse.json({ message: "Phone number supplier product is invalid." }, { status: 400 });
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId: session.user.id } });

  if (!wallet || wallet.balanceKobo < priceKobo) {
    return NextResponse.json({ message: "Insufficient wallet balance. Please add funds." }, { status: 402 });
  }

  const order = await prisma.$transaction(async (tx) => {
    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balanceKobo: {
          decrement: priceKobo,
        },
      },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "PURCHASE",
        amountKobo: -priceKobo,
        description: product.name,
      },
    });

    return tx.order.create({
      data: {
        userId: session.user.id,
        status: "FULFILLING",
        totalKobo: priceKobo,
        providerMeta: {
          provider: "5sim",
          product: {
            id: product.id,
            name: product.name,
            country: product.country,
            type: product.type,
          },
        },
      },
      select: {
        id: true,
      },
    });
  });

  try {
    const supplierOrder = await createFiveSimOrder(fiveSimOrderParts);
    const delivery = getFiveSimDelivery(supplierOrder);

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: delivery.phoneNumber ? "FULFILLED" : "FULFILLING",
        providerMeta: {
          provider: "5sim",
          supplierOrder: JSON.parse(JSON.stringify(supplierOrder)),
          product: {
            id: product.id,
            name: product.name,
            country: product.country,
            type: product.type,
          },
          delivery: JSON.parse(JSON.stringify(delivery)),
        },
      },
    });
  } catch (error) {
    const publicMessage = error instanceof FiveSimPublicError ? error.message : "Phone number supplier order failed.";

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: {
          status: "FAILED",
          providerMeta: {
            provider: "5sim",
            product: {
              id: product.id,
              name: product.name,
              country: product.country,
              type: product.type,
            },
            error: publicMessage,
          },
        },
      }),
      prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balanceKobo: {
            increment: priceKobo,
          },
        },
      }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "REFUND",
          amountKobo: priceKobo,
          reference: order.id,
          description: `Refund for failed phone number order: ${product.name}`,
        },
      }),
    ]);

    return NextResponse.json({ message: "Phone number supply is temporarily unavailable. Your wallet has been refunded." }, { status: 502 });
  }

  return NextResponse.json({ orderId: order.id });
}