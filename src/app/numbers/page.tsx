import { getPublicNumberCatalogResult } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function NumbersPage() {
  const catalog = await getPublicNumberCatalogResult();
  const products = catalog.products;
  const liveProducts = products.filter((product) => product.orderable && product.availability !== "Unavailable");
  const previewProducts = products.filter((product) => !product.orderable || product.availability === "Unavailable");

  return (
    <main className="min-h-screen bg-[#07111F] px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-8">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-cyan-200">Main VortexList marketplace</p>
          <h1 className="mt-4 text-5xl font-black text-white">Global phone numbers for SMS activation</h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-300">Choose a country and service, buy with wallet balance, then track your number, expiry and SMS code from the orders page.</p>
        </div>
        <div className="mt-6 rounded-3xl border border-cyan-300/15 bg-cyan-300/10 p-4 text-sm font-semibold text-cyan-100">
          {catalog.status.message}
        </div>
        <section className="mt-10 grid gap-5 md:grid-cols-3">
          {liveProducts.length > 0 ? (
            liveProducts.map((product) => (
              <article className="glass-panel rounded-3xl p-6" key={product.id}>
                <p className="text-sm font-bold text-cyan-300">{product.country}</p>
                <h2 className="mt-3 text-2xl font-black text-white">{product.name}</h2>
                <p className="mt-2 text-slate-400">{product.type}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-300">
                  <span className="rounded-xl bg-white/[0.04] px-3 py-2">Wallet checkout</span>
                  <span className="rounded-xl bg-white/[0.04] px-3 py-2">SMS tracking</span>
                </div>
                <p className="mt-5 text-xl font-black text-white">{product.priceLabel}</p>
                <p className="mt-2 text-sm text-slate-400">{product.delivery}</p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span className="inline-flex rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">{product.availability}</span>
                  {!product.orderable ? <span className="inline-flex rounded-full bg-orange-400/10 px-3 py-1 text-xs font-bold text-orange-200">Ordering soon</span> : null}
                  <a className="rounded-full bg-cyan-400 px-4 py-2 text-xs font-black text-slate-950 hover:bg-cyan-300" href={`/numbers/${product.id}`}>View details</a>
                </div>
              </article>
            ))
          ) : (
            <div className="glass-panel rounded-3xl p-8 text-center text-slate-300 md:col-span-3">
              Live number ordering is not available right now. Please confirm your SMS-MAN API key is configured in Vercel and redeploy.
            </div>
          )}
        </section>
        {previewProducts.length > 0 ? (
          <section className="mt-10 rounded-3xl border border-orange-300/15 bg-orange-400/10 p-6 text-orange-100">
            <h2 className="text-xl font-black text-white">Preview-only number options hidden from checkout</h2>
            <p className="mt-2 text-sm font-semibold">
              {previewProducts.length} number option{previewProducts.length === 1 ? " is" : "s are"} visible as catalog preview only. Customers cannot buy them until live ordering is connected.
            </p>
          </section>
        ) : null}
      </div>
    </main>
  );
}