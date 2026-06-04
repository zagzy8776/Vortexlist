import { getPublicProxyCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default function ProxiesPage() {
  return <CategoryPage title="Proxy marketplace" subtitle="Datacenter, residential, ISP and mobile proxy access by country, package and use case." />;
}

async function CategoryPage({ title, subtitle }: { title: string; subtitle: string }) {
  const catalog = await getPublicProxyCatalog();
  const products = catalog.products;
  const liveProducts = products.filter((product) => product.orderable && product.availability !== "Unavailable");
  const previewProducts = products.filter((product) => !product.orderable || product.availability === "Unavailable");

  return (
    <main className="min-h-screen bg-[#07111F] px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-5xl font-black text-white">{title}</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-300">{subtitle}</p>
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
                <p className="mt-5 text-xl font-black text-white">{product.priceLabel}</p>
                <p className="mt-2 text-sm text-slate-400">{product.delivery}</p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span className="inline-flex rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">{product.availability}</span>
                  {!product.orderable ? <span className="inline-flex rounded-full bg-orange-400/10 px-3 py-1 text-xs font-bold text-orange-200">Ordering soon</span> : null}
                  <a className="rounded-full bg-cyan-400 px-4 py-2 text-xs font-black text-slate-950 hover:bg-cyan-300" href={`/proxies/${product.id}`}>View details</a>
                </div>
              </article>
            ))
          ) : (
            <div className="glass-panel rounded-3xl p-8 text-center text-slate-300 md:col-span-3">
              No live proxy products are orderable right now. Please check back shortly so no customer pays before delivery is ready.
            </div>
          )}
        </section>
        {previewProducts.length > 0 ? (
          <section className="mt-10 rounded-3xl border border-orange-300/15 bg-orange-400/10 p-6 text-orange-100">
            <h2 className="text-xl font-black text-white">Preview-only proxy options hidden from checkout</h2>
            <p className="mt-2 text-sm font-semibold">
              {previewProducts.length} proxy option{previewProducts.length === 1 ? " is" : "s are"} available as catalog preview only. They are not shown for purchase until live ordering and delivery are connected.
            </p>
          </section>
        ) : null}
      </div>
    </main>
  );
}