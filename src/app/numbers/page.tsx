import { getPublicNumberCatalogResult } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const popularServices = ["WhatsApp", "Telegram", "Google", "Instagram", "Facebook", "TikTok", "Discord", "Twitter"];

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NumbersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; service?: string | string[]; sort?: string | string[] }>;
}) {
  const query = await searchParams;
  const search = getQueryValue(query.q)?.trim().toLowerCase() ?? "";
  const selectedService = getQueryValue(query.service)?.trim().toLowerCase() ?? "";
  const sort = getQueryValue(query.sort)?.trim().toLowerCase() ?? "stock";
  const catalog = await getPublicNumberCatalogResult();
  const products = catalog.products
    .filter((product) => {
      const haystack = [product.country, product.service, product.name].join(" ").toLowerCase();
      const matchesSearch = !search || haystack.includes(search);
      const matchesService = !selectedService || product.service?.toLowerCase().includes(selectedService);

      return matchesSearch && matchesService;
    })
    .sort((a, b) => {
      if (sort === "cheapest") return a.priceLabel.localeCompare(b.priceLabel);
      if (sort === "fastest") return a.delivery.localeCompare(b.delivery);

      return (b.availableCount ?? 0) - (a.availableCount ?? 0);
    });
  const liveProducts = products.filter((product) => product.orderable && product.availability !== "Unavailable");
  const previewProducts = products.filter((product) => !product.orderable || product.availability === "Unavailable");

  return (
    <main className="min-h-screen bg-[#07111F] px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-8">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-cyan-200">Main VortexList marketplace</p>
          <h1 className="mt-4 text-5xl font-black text-white">Global phone numbers for SMS activation</h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-300">Choose a country and service, buy with wallet balance, then track your number, expiry and SMS code from the orders page.</p>
          <div className="mt-6 grid gap-3 text-sm font-semibold text-cyan-50 md:grid-cols-3">
            <div className="rounded-2xl border border-cyan-300/20 bg-slate-950/30 p-4">Average SMS arrival: 1–5 minutes</div>
            <div className="rounded-2xl border border-cyan-300/20 bg-slate-950/30 p-4">Automatic refund if no number is delivered</div>
            <div className="rounded-2xl border border-cyan-300/20 bg-slate-950/30 p-4">Best route selected automatically</div>
          </div>
        </div>
        <div className="mt-6 rounded-3xl border border-cyan-300/15 bg-cyan-300/10 p-4 text-sm font-semibold text-cyan-100">
          {catalog.status.message}
        </div>
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex flex-wrap gap-3">
            {popularServices.map((service) => {
              const href = selectedService === service.toLowerCase() ? "/numbers" : `/numbers?service=${encodeURIComponent(service.toLowerCase())}`;

              return (
                <a className={`rounded-full px-4 py-2 text-sm font-black ${selectedService === service.toLowerCase() ? "bg-cyan-300 text-slate-950" : "bg-white/[0.05] text-cyan-100 hover:bg-white/10"}`} href={href} key={service}>
                  {service} numbers
                </a>
              );
            })}
          </div>
          <form className="mt-5 grid gap-3 md:grid-cols-[1fr_220px_140px]" action="/numbers">
            <input name="service" type="hidden" value={selectedService} />
            <input className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-300" defaultValue={search} name="q" placeholder="Search country or app service" />
            <select className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-300" defaultValue={sort} name="sort">
              <option value="stock">Highest stock</option>
              <option value="cheapest">Cheapest</option>
              <option value="fastest">Fastest delivery</option>
            </select>
            <button className="rounded-2xl bg-cyan-400 px-5 py-3 font-black text-slate-950 hover:bg-cyan-300" type="submit">Filter</button>
          </form>
        </section>
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
                  <span className="rounded-xl bg-white/[0.04] px-3 py-2">No fake stock</span>
                  <span className="rounded-xl bg-white/[0.04] px-3 py-2">Auto refund before delivery</span>
                </div>
                <p className="mt-5 text-xl font-black text-white">{product.priceLabel}</p>
                <p className="mt-2 text-sm text-slate-400">{product.delivery}</p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span className="inline-flex rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">{product.stockLabel ?? product.availability}</span>
                  <span className="inline-flex rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-200">Best route selected automatically</span>
                  {!product.orderable ? <span className="inline-flex rounded-full bg-orange-400/10 px-3 py-1 text-xs font-bold text-orange-200">Ordering soon</span> : null}
                  <a className="rounded-full bg-cyan-400 px-4 py-2 text-xs font-black text-slate-950 hover:bg-cyan-300" href={`/numbers/${product.id}`}>View details</a>
                </div>
              </article>
            ))
          ) : (
            <div className="glass-panel rounded-3xl p-8 text-center text-slate-300 md:col-span-3">
              Live number ordering is not available right now. Please confirm at least one number provider API key is configured and redeploy.
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