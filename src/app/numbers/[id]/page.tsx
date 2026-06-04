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

  const priceConfigured = Boolean(getNumberPriceKobo(product));
  const isOrderDisabled = !priceConfigured || product.availability === "Unavailable" || !product.orderable;
  const orderUnavailableReason = !priceConfigured
    ? "Pricing is not configured yet."
    : !product.orderable
      ? "This phone number option is only a preview right now. Live ordering is being connected."
      : product.availability === "Unavailable"
        ? "This phone number option is unavailable right now."
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
              <p className="mt-2 font-black text-white">{product.availability}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Delivery</p>
              <p className="mt-2 font-black text-white">{product.delivery}</p>
            </div>
          </div>
          {orderUnavailableReason ? <p className="mt-6 rounded-2xl bg-orange-400/10 px-4 py-3 text-sm font-semibold text-orange-100">{orderUnavailableReason}</p> : null}
          <NumberOrderButton disabled={isOrderDisabled} productId={product.id} />
          <p className="mt-3 text-center text-sm text-slate-400">Ordering uses your wallet balance and delivers the number securely in your orders.</p>
        </section>
      </div>
    </main>
  );
}