export default function ProxiesPage() {
  return <CategoryPage title="Proxy marketplace" subtitle="Datacenter, residential, ISP and mobile proxy access by country, package and use case." />;
}

function CategoryPage({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <main className="min-h-screen bg-[#07111F] px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-5xl font-black text-white">{title}</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-300">{subtitle}</p>
      </div>
    </main>
  );
}