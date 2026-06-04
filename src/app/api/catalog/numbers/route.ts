import { NextResponse } from "next/server";
import { getPublicNumberCatalogResult } from "@/lib/catalog";

export async function GET() {
  const catalog = await getPublicNumberCatalogResult();

  return NextResponse.json(catalog);
}