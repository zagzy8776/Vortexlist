import { redirect } from "next/navigation";
import { verifyWalletDeposit } from "@/lib/payments/paystack";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProcessWalletVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const session = await getCurrentSession();

  if (!session?.user) redirect("/signin");

  const { reference } = await searchParams;

  if (!reference) redirect("/wallet");

  const deposit = await prisma.walletDeposit.findUnique({ where: { reference } });

  if (!deposit || deposit.userId !== session.user.id) redirect("/wallet");

  if (deposit.status !== "VERIFIED") {
    const verification = await verifyWalletDeposit(reference);

    if (verification.status === "success" && verification.amount === deposit.amountKobo && verification.currency === "NGN") {
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
          data: { balanceKobo: { increment: deposit.amountKobo } },
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
    }
  }

  redirect("/wallet");
}