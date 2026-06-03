import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { getPrivateSupplyStatus } from "@/lib/providers/supply-status";
import { getProxySellerBalanceUsd, getSafeProxySellerCatalog } from "@/lib/providers/proxy-seller";
import { getSafeProxyAvailabilityFromWebshare } from "@/lib/providers/webshare";

export async function GET() {
  const session = await getCurrentSession();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const [proxy, proxySeller, proxySellerBalance] = await Promise.all([
    getSafeProxyAvailabilityFromWebshare(),
    getSafeProxySellerCatalog(),
    getProxySellerBalanceUsd().catch(() => null),
  ]);

  return NextResponse.json({
    status: getPrivateSupplyStatus(),
    proxy: {
      ok: proxy.ok,
      message: proxy.message,
      countryCount: proxy.countries.length,
      statusCode: proxy.statusCode,
    },
    proxySeller: {
      ok: proxySeller.ok,
      message: proxySeller.message,
      countryCount: proxySeller.countries.length,
      statusCode: proxySeller.statusCode,
      balanceUsd: proxySellerBalance,
      orderingConnected: Boolean(process.env.PROXY_SELLER_API_KEY),
    },
  });
}