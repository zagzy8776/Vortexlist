const adminModules = ["Users", "Orders", "Products", "Countries", "Providers", "Pricing rules", "Wallet transactions", "Manual deposits", "API logs"];

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[#07111F] px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-black text-white">Admin control center</h1>
        <p className="mt-2 text-slate-400">Manage pricing, providers, users, deposits and fulfillment.</p>
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {adminModules.map((module) => (
            <div key={module} className="glass-panel rounded-3xl p-6">
              <h2 className="text-xl font-bold text-white">{module}</h2>
              <p className="mt-2 text-sm text-slate-400">Foundation module ready for backend wiring.</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}