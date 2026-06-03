import { NextResponse } from "next/server";
import { getPublicNumberCatalog } from "@/lib/catalog";

export async function GET() {
  const products = await getPublicNumberCatalog();

  return NextResponse.json({ products });
}