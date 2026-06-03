import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicProxyCatalog, getProxyPriceKobo } from "@/lib/catalog";
import { ProxyOrderButton } from "@/components/proxy-order-button";

export const dynamic = "force-dynamic";

export default async function ProxyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const catalog = await getPublicProxyCatalog();
  const product = catalog.products.find((item) => item.id === id);

  if (!product) {
    notFound();
  }

  const priceConfigured = Boolean(getProxyPriceKobo(product));
  const isOrderDisabled = !priceConfigured || product.availability === "Unavailable" || !product.orderable;
  const orderUnavailableReason = !priceConfigured
    ? "Pricing is not configured yet."
    : !product.orderable
      ? "This supplier catalog is only a preview right now. Live ordering is connected for Webshare-deliverable proxies only."
      : product.availability === "Unavailable"
        ? "This proxy location is unavailable right now."
        : null;

  return (
    <main className="min-h-screen bg-[#07111F] px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <Link className="text-sm font-bold text-cyan-300" href="/proxies">← Back to proxies</Link>
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
          <ProxyOrderButton disabled={isOrderDisabled} productId={product.id} />
          <p className="mt-3 text-center text-sm text-slate-400">Ordering uses your wallet balance and delivers access securely in your orders.</p>
        </section>
      </div>
    </main>
  );
}