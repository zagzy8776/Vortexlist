import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { processPendingFulfillments } from "@/lib/fulfillment";

function isAuthorizedWorkerRequest(request: Request) {
  const configuredSecret = process.env.WORKER_SECRET;
  const providedSecret = request.headers.get("x-worker-secret");

  return Boolean(configuredSecret && providedSecret && configuredSecret === providedSecret);
}

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!isAuthorizedWorkerRequest(request) && session?.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const result = await processPendingFulfillments();

  return NextResponse.json({ ok: true, result });
}