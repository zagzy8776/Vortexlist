import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { getPrivateSupplyStatus } from "@/lib/providers/supply-status";
import { getSafeProxyAvailabilityFromWebshare } from "@/lib/providers/webshare";

export async function GET() {
  const session = await getCurrentSession();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const proxy = await getSafeProxyAvailabilityFromWebshare();

  return NextResponse.json({
    status: getPrivateSupplyStatus(),
    proxy: {
      ok: proxy.ok,
      message: proxy.message,
      countryCount: proxy.countries.length,
      statusCode: proxy.statusCode,
    },
  });
}