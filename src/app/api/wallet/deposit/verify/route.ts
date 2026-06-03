import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { verifyWalletDeposit } from "@/lib/payments/paystack";
import { prisma } from "@/lib/prisma";

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

  if (verification.status !== "success" || verification.amount !== deposit.amountKobo || verification.currency !== "NGN") {
    await prisma.walletDeposit.update({
      where: { reference },
      data: {
        status: "FAILED",
        providerMeta: verification,
      },
    });

    return NextResponse.json({ message: "Payment could not be verified." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.walletDeposit.update({
      where: { reference },
      data: {
        status: "VERIFIED",
        verifiedAt: new Date(),
        providerMeta: verification,
      },
    }),
    prisma.wallet.update({
      where: { id: deposit.walletId },
      data: {
        balanceKobo: {
          increment: deposit.amountKobo,
        },
      },
    }),
    prisma.walletTransaction.create({
      data: {
        walletId: deposit.walletId,
        type: "DEPOSIT",
        amountKobo: deposit.amountKobo,
        reference,
        description: "Wallet funding",
      },
    }),
  ]);

  return NextResponse.json({ message: "Wallet credited successfully." });
}