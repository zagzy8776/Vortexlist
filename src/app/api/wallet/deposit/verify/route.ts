import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { verifyWalletDeposit } from "@/lib/payments/paystack";
import { prisma } from "@/lib/prisma";
import { creditVerifiedWalletDeposit } from "@/lib/wallet-deposits";

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session?.user) {
    return NextResponse.json({ message: "Please sign in to verify wallet funding." }, { status: 401 });
  }

  const body = (await request.json()) as { reference?: string };
  const reference = body.reference?.trim();

  if (!reference) {
    return NextResponse.json({ message: "Payment reference is required." }, { status: 400 });
  }

  const deposit = await prisma.walletDeposit.findUnique({ where: { reference } });

  if (!deposit || deposit.userId !== session.user.id) {
    return NextResponse.json({ message: "Payment record was not found." }, { status: 404 });
  }

  if (deposit.status === "VERIFIED") {
    return NextResponse.json({ message: "Wallet already credited." });
  }

  const verification = await verifyWalletDeposit(reference);
  const result = await creditVerifiedWalletDeposit(reference, verification);

  return NextResponse.json({ message: result.message }, { status: result.ok ? 200 : 400 });
}