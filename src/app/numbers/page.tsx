import { getPublicNumberCatalog } from "@/lib/catalog";

export default async function NumbersPage() {
  const products = await getPublicNumberCatalog();

  return (
    <main className="min-h-screen bg-[#07111F] px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-5xl font-black text-white">Global phone numbers</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-300">Browse country-based phone number access with clean pricing, wallet checkout and order tracking.</p>
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