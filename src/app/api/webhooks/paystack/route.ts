import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { creditVerifiedWalletDeposit, type PaystackVerificationData } from "@/lib/wallet-deposits";

type PaystackWebhookPayload = {
  event?: string;
  data?: PaystackVerificationData;
};

function verifyPaystackSignature(rawBody: string, signature: string | null) {
  const secret = process.env.PAYSTACK_SECRET_KEY;

  if (!secret || !signature) {
    return false;
  }

  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  const actualBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!verifyPaystackSignature(rawBody, request.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ message: "Invalid webhook signature." }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as PaystackWebhookPayload;

  if (payload.event !== "charge.success") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const paymentData = payload.data;
  const reference = paymentData?.reference?.trim();

  if (!reference || !paymentData) {
    return NextResponse.json({ message: "Payment reference is required." }, { status: 400 });
  }

  const result = await creditVerifiedWalletDeposit(reference, paymentData);

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}