import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { getPrivateSupplyStatus } from "@/lib/providers/supply-status";

export async function GET() {
  const session = await getCurrentSession();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ status: getPrivateSupplyStatus() });
}