import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export type PaystackVerificationData = {
  status?: string;
  reference?: string;
  amount?: number;
  currency?: string;
  paid_at?: string;
  [key: string]: unknown;
};

export async function creditVerifiedWalletDeposit(reference: string, verification: PaystackVerificationData) {
  const deposit = await prisma.walletDeposit.findUnique({ where: { reference } });

  if (!deposit) {
    return { ok: false, credited: false, message: "Payment record was not found." };
  }

  if (deposit.status === "VERIFIED") {
    return { ok: true, credited: false, message: "Wallet already credited." };
  }

  if (verification.status !== "success" || verification.amount !== deposit.amountKobo || verification.currency !== "NGN") {
    await prisma.walletDeposit.update({
      where: { reference },
      data: {
        status: "FAILED",
        providerMeta: verification as Prisma.InputJsonValue,
      },
    });

    return { ok: false, credited: false, message: "Payment could not be verified." };
  }

  await prisma.$transaction([
    prisma.walletDeposit.update({
      where: { reference },
      data: {
        status: "VERIFIED",
        verifiedAt: verification.paid_at ? new Date(verification.paid_at) : new Date(),
        providerMeta: verification as Prisma.InputJsonValue,
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

  return { ok: true, credited: true, message: "Wallet credited successfully." };
}