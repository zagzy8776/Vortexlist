import { NextResponse } from "next/server";
import { getPublicProxyCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const catalog = await getPublicProxyCatalog();

  return NextResponse.json(catalog);
}