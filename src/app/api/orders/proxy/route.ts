import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { getPublicProxyCatalog, getProxyPriceKobo } from "@/lib/catalog";
import { ProxySellerPublicError, assertProxySellerCanFundOrder, calculateProxySellerOrder, createProxySellerOrder, getProxySellerCountryIdFromProductId, getProxySellerDelivery, isProxySellerProductId } from "@/lib/providers/proxy-seller";
import { getProxyDeliveryByCountry } from "@/lib/providers/webshare";
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

  const catalog = await getPublicProxyCatalog();
  const product = catalog.products.find((item) => item.id === productId);

  if (!product?.countryCode) {
    return NextResponse.json({ message: "Proxy product is not available right now." }, { status: 404 });
  }

  if (!product.orderable || product.availability === "Unavailable") {
    return NextResponse.json({ message: "This proxy product is not orderable right now." }, { status: 400 });
  }

  const priceKobo = getProxyPriceKobo(product);

  if (!priceKobo) {
    return NextResponse.json({ message: "Proxy pricing is not configured yet." }, { status: 400 });
  }

  const proxySellerCountryId = isProxySellerProductId(product.id) ? getProxySellerCountryIdFromProductId(product.id) : null;
  const isProxySellerOrder = Boolean(proxySellerCountryId);
  const webshareDelivery = isProxySellerOrder ? null : await getProxyDeliveryByCountry(product.countryCode);

  if (!isProxySellerOrder && !webshareDelivery) {
    return NextResponse.json({ message: "Proxy delivery is not available right now." }, { status: 400 });
  }

  if (isProxySellerOrder && !proxySellerCountryId) {
    return NextResponse.json({ message: "Proxy supplier product is invalid." }, { status: 400 });
  }

  if (isProxySellerOrder && proxySellerCountryId) {
    try {
      const supplierQuote = await calculateProxySellerOrder(proxySellerCountryId);

      if (!supplierQuote.total) {
        return NextResponse.json({ message: "Proxy supplier pricing is unavailable right now." }, { status: 400 });
      }

      await assertProxySellerCanFundOrder(supplierQuote.total);
    } catch (error) {
      const message = error instanceof ProxySellerPublicError ? error.message : "Proxy supply is temporarily unavailable.";

      return NextResponse.json({ message }, { status: 400 });
    }
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
        status: isProxySellerOrder ? "FULFILLING" : "FULFILLED",
        totalKobo: priceKobo,
        providerMeta: {
          provider: isProxySellerOrder ? "proxy-seller" : "webshare",
          product: {
            id: product.id,
            name: product.name,
            country: product.country,
            type: product.type,
          },
          delivery: webshareDelivery,
        },
      },
      select: {
        id: true,
      },
    });
  });

  if (isProxySellerOrder && proxySellerCountryId) {
    try {
      const supplierOrder = await createProxySellerOrder(proxySellerCountryId);
      const delivery = await getProxySellerDelivery(supplierOrder.orderId!);

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: delivery.length > 0 ? "FULFILLED" : "FULFILLING",
          providerMeta: {
            provider: "proxy-seller",
            supplierOrder,
            product: {
              id: product.id,
              name: product.name,
              country: product.country,
              type: product.type,
            },
            delivery,
          },
        },
      });
    } catch (error) {
      const publicMessage = error instanceof ProxySellerPublicError ? error.message : "Proxy supplier order failed.";

      await prisma.$transaction([
        prisma.order.update({
          where: { id: order.id },
          data: {
            status: "FAILED",
            providerMeta: {
              provider: "proxy-seller",
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
            description: `Refund for failed proxy order: ${product.name}`,
          },
        }),
      ]);

      return NextResponse.json({ message: "Proxy supply is temporarily unavailable. Your wallet has been refunded." }, { status: 502 });
    }
  }

  return NextResponse.json({ orderId: order.id });
}