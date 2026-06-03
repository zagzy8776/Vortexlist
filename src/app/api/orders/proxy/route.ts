import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { getPublicProxyCatalog, getProxyPriceKobo } from "@/lib/catalog";
import { getProxyDeliveryByCountry } from "@/lib/providers/webshare";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session?.user) {
    return NextResponse.json({ message: "Please sign in to place an order." }, { status: 401 });
  }

  const priceKobo = getProxyPriceKobo();

  if (!priceKobo) {
    return NextResponse.json({ message: "Proxy pricing is not configured yet." }, { status: 400 });
  }

  const body = (await request.json()) as { productId?: string };
  const productId = body.productId?.trim();

  if (!productId) {
    return NextResponse.json({ message: "Product is required." }, { status: 400 });
  }

  const catalog = await getPublicProxyCatalog();
  const product = catalog.products.find((item) => item.id === productId);

  if (!product?.countryCode) {
    return NextResponse.json({ message: "Proxy product is not available right now." }, { status: 404 });
  }

  const delivery = await getProxyDeliveryByCountry(product.countryCode);

  if (!delivery) {
    return NextResponse.json({ message: "Proxy delivery is not available right now." }, { status: 400 });
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
        status: "FULFILLED",
        totalKobo: priceKobo,
        providerMeta: {
          product: {
            id: product.id,
            name: product.name,
            country: product.country,
            type: product.type,
          },
          delivery,
        },
      },
      select: {
        id: true,
      },
    });
  });

  return NextResponse.json({ orderId: order.id });
}