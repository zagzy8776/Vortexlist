import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { formatNairaFromKobo } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/logout-button";
import { DashboardNav } from "@/components/dashboard-nav";

export default async function DashboardPage() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/signin");
  }

  const [wallet, orderCount, numberOrderCount] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: session.user.id } }),
    prisma.order.count({ where: { userId: session.user.id } }),
    prisma.order.count({
      where: {
        userId: session.user.id,
        providerMeta: {
          path: ["provider"],
          equals: "5sim",
        },
      },
    }),
  ]);

  const cards = [
    ["Wallet", formatNairaFromKobo(wallet?.balanceKobo ?? 0), "Fund your account and buy services faster"],
    ["Phone numbers", String(numberOrderCount), "View purchased numbers, activation status and SMS codes"],
    ["Orders", String(orderCount), "Track purchases and fulfillment status"],
    ["Active proxies", "0", "Manage secondary proxy access"],
  ];

  return (
    <main className="min-h-screen bg-[#07111F] px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-4xl font-black text-white">Number activation dashboard</h1>
            <p className="mt-2 text-slate-400">Welcome back, {session.user.name ?? session.user.email}. Buy phone numbers, monitor SMS delivery, manage wallet funding and track all orders from one place.</p>
          </div>
          <LogoutButton />
        </div>
        <DashboardNav />
        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {cards.map(([title, value, body]) => (
            <div key={title} className="glass-panel rounded-3xl p-6">
              <p className="text-sm font-semibold text-cyan-300">{title}</p>
              <p className="mt-3 text-3xl font-black text-white">{value}</p>
              <p className="mt-3 text-sm leading-6 text-slate-400">{body}</p>
            </div>
          ))}
        </section>
        <section className="mt-8 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <Link className="glass-panel rounded-3xl p-8 transition hover:-translate-y-1 hover:border-cyan-300/40" href="/numbers">
            <p className="text-sm font-bold text-cyan-300">Main marketplace</p>
            <h2 className="mt-3 text-3xl font-black text-white">Buy phone numbers for SMS activation</h2>
            <p className="mt-3 text-slate-400">Choose the app service and country, pay from your wallet, then refresh SMS status from your orders.</p>
          </Link>
          <Link className="glass-panel rounded-3xl p-6 transition hover:-translate-y-1 hover:border-cyan-300/40" href="/proxies">
            <p className="text-sm font-bold text-cyan-300">Buy proxies</p>
            <h2 className="mt-3 text-2xl font-black text-white">Browse proxy packages</h2>
            <p className="mt-3 text-slate-400">Choose proxy access by type, country and delivery status.</p>
          </Link>
        </section>
      </div>
    </main>
  );
}