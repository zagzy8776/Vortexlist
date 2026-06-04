import Link from "next/link";
import { notFound } from "next/navigation";
import { NumberOrderButton } from "@/components/number-order-button";
import { getNumberPriceKobo, getPublicNumberCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function NumberDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const products = await getPublicNumberCatalog();
  const product = products.find((item) => item.id === id);

  if (!product) {
    notFound();
  }

  if (!product.orderable || product.availability === "Unavailable") {
    notFound();
  }

  const priceConfigured = Boolean(getNumberPriceKobo(product));
  const isOrderDisabled = !priceConfigured;
  const orderUnavailableReason = !priceConfigured
    ? "Pricing is not configured yet."
    : null;

  return (
    <main className="min-h-screen bg-[#07111F] px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <Link className="text-sm font-bold text-cyan-300" href="/numbers">← Back to numbers</Link>
        <section className="glass-panel mt-6 rounded-[2rem] p-8">
          <p className="text-sm font-bold text-cyan-300">{product.country}</p>
          <h1 className="mt-3 text-4xl font-black text-white">{product.name}</h1>
          <p className="mt-3 text-lg text-slate-300">{product.type}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Price</p>
              <p className="mt-2 font-black text-white">{product.priceLabel}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Availability</p>
              <p className="mt-2 font-black text-white">{product.stockLabel ?? product.availability}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Delivery</p>
              <p className="mt-2 font-black text-white">{product.delivery}</p>
            </div>
          </div>
          <div className="mt-8 rounded-3xl border border-cyan-300/15 bg-cyan-300/10 p-5">
            <h2 className="text-xl font-black text-white">How it works</h2>
            <ol className="mt-4 grid gap-3 text-sm font-semibold text-cyan-50 sm:grid-cols-2">
              <li className="rounded-2xl bg-slate-950/30 p-4">1. Pay securely with wallet balance.</li>
              <li className="rounded-2xl bg-slate-950/30 p-4">2. VortexList selects the best available route.</li>
              <li className="rounded-2xl bg-slate-950/30 p-4">3. Receive the number in your orders page.</li>
              <li className="rounded-2xl bg-slate-950/30 p-4">4. Refresh SMS status until the code arrives.</li>
            </ol>
          </div>
          <div className="mt-6 rounded-3xl border border-emerald-300/15 bg-emerald-400/10 p-5 text-sm font-semibold text-emerald-50">
            <p className="font-black text-white">Transparent protection policy</p>
            <p className="mt-2">If no number is delivered by the supplier, your wallet is refunded automatically. After a number is issued, SMS delivery depends on the selected app and network route; if the code does not arrive, open a support ticket from your orders with the order ID attached.</p>
          </div>
          {orderUnavailableReason ? <p className="mt-6 rounded-2xl bg-orange-400/10 px-4 py-3 text-sm font-semibold text-orange-100">{orderUnavailableReason}</p> : null}
          <NumberOrderButton disabled={isOrderDisabled} productId={product.id} />
          <p className="mt-3 text-center text-sm text-slate-400">Ordering uses your wallet balance and delivers the number securely in your orders.</p>
        </section>
      </div>
    </main>
  );
}