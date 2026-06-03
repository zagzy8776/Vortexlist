import { NextResponse } from "next/server";
import { getPublicProxyCatalog } from "@/lib/catalog";

export async function GET() {
  const products = await getPublicProxyCatalog();

  return NextResponse.json({ products });
}