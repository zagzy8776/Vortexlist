import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { formatNairaFromKobo } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/logout-button";

export default async function DashboardPage() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/signin");
  }

  const [wallet, orderCount] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: session.user.id } }),
    prisma.order.count({ where: { userId: session.user.id } }),
  ]);

  const cards = [
    ["Wallet", formatNairaFromKobo(wallet?.balanceKobo ?? 0), "Fund your account and buy services faster"],
    ["Active proxies", "0", "Manage your purchased proxy access"],
    ["Phone numbers", "0", "View your purchased numbers and SMS activity"],
    ["Orders", String(orderCount), "Track purchases and fulfillment status"],
  ];

  return (
    <main className="min-h-screen bg-[#07111F] px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-4xl font-black text-white">Customer dashboard</h1>
            <p className="mt-2 text-slate-400">Welcome back, {session.user.name ?? session.user.email}. Browse services, manage your wallet, track orders and get support from one place.</p>
          </div>
          <LogoutButton />
        </div>
        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {cards.map(([title, value, body]) => (
            <div key={title} className="glass-panel rounded-3xl p-6">
              <p className="text-sm font-semibold text-cyan-300">{title}</p>
              <p className="mt-3 text-3xl font-black text-white">{value}</p>
              <p className="mt-3 text-sm leading-6 text-slate-400">{body}</p>
            </div>
          ))}
        </section>
        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <a className="glass-panel rounded-3xl p-6 transition hover:-translate-y-1 hover:border-cyan-300/40" href="/numbers">
            <p className="text-sm font-bold text-cyan-300">Buy numbers</p>
            <h2 className="mt-3 text-2xl font-black text-white">Browse phone number access</h2>
            <p className="mt-3 text-slate-400">Search countries, compare clean prices and place orders from your wallet.</p>
          </a>
          <a className="glass-panel rounded-3xl p-6 transition hover:-translate-y-1 hover:border-cyan-300/40" href="/proxies">
            <p className="text-sm font-bold text-cyan-300">Buy proxies</p>
            <h2 className="mt-3 text-2xl font-black text-white">Browse proxy packages</h2>
            <p className="mt-3 text-slate-400">Choose proxy access by type, country and delivery status.</p>
          </a>
        </section>
      </div>
    </main>
  );
}