import { getPublicProxyCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default function ProxiesPage() {
  return <CategoryPage title="Proxy marketplace" subtitle="Datacenter, residential, ISP and mobile proxy access by country, package and use case." />;
}

async function CategoryPage({ title, subtitle }: { title: string; subtitle: string }) {
  const products = await getPublicProxyCatalog();

  return (
    <main className="min-h-screen bg-[#07111F] px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-5xl font-black text-white">{title}</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-300">{subtitle}</p>
        <div className="mt-6 rounded-3xl border border-cyan-300/15 bg-cyan-300/10 p-4 text-sm font-semibold text-cyan-100">
          Live availability is checked securely in the backend. Supplier details and internal costs are hidden from customers.
        </div>
        <section className="mt-10 grid gap-5 md:grid-cols-3">
          {products.map((product) => (
            <article className="glass-panel rounded-3xl p-6" key={product.id}>
              <p className="text-sm font-bold text-cyan-300">{product.country}</p>
              <h2 className="mt-3 text-2xl font-black text-white">{product.name}</h2>
              <p className="mt-2 text-slate-400">{product.type}</p>
              <p className="mt-5 text-xl font-black text-white">{product.priceLabel}</p>
              <p className="mt-2 text-sm text-slate-400">{product.delivery}</p>
              <span className="mt-5 inline-flex rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">{product.availability}</span>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}