import { redirect } from "next/navigation";
import { verifyWalletDeposit } from "@/lib/payments/paystack";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { creditVerifiedWalletDeposit } from "@/lib/wallet-deposits";

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
    await creditVerifiedWalletDeposit(reference, verification);
  }

  redirect("/wallet");
}