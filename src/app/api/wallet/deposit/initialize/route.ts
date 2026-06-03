import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { initializeWalletDeposit } from "@/lib/payments/paystack";
import { prisma } from "@/lib/prisma";

const MIN_DEPOSIT_KOBO = 1_000 * 100;
const MAX_DEPOSIT_KOBO = 1_000_000 * 100;

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session?.user?.email) {
    return NextResponse.json({ message: "Please sign in to fund your wallet." }, { status: 401 });
  }

  const body = (await request.json()) as { amountNaira?: number };
  const amountNaira = Number(body.amountNaira);
  const amountKobo = Math.round(amountNaira * 100);

  if (!Number.isFinite(amountNaira) || amountKobo < MIN_DEPOSIT_KOBO || amountKobo > MAX_DEPOSIT_KOBO) {
    return NextResponse.json({ message: "Enter an amount between ₦1,000 and ₦1,000,000." }, { status: 400 });
  }

  const wallet = await prisma.wallet.upsert({
    where: { userId: session.user.id },
    update: {},
    create: {
      userId: session.user.id,
      currency: "NGN",
      balanceKobo: 0,
    },
  });

  const reference = `vx_${Date.now()}_${crypto.randomUUID().replaceAll("-", "").slice(0, 18)}`;
  const siteUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const payment = await initializeWalletDeposit({
    email: session.user.email,
    amountKobo,
    reference,
    callbackUrl: `${siteUrl}/wallet/verify?reference=${reference}`,
  });

  await prisma.walletDeposit.create({
    data: {
      userId: session.user.id,
      walletId: wallet.id,
      amountKobo,
      reference,
      authorizationUrl: payment.authorization_url,
      providerMeta: {
        accessCode: payment.access_code,
      },
    },
  });

  return NextResponse.json({ authorizationUrl: payment.authorization_url });
}