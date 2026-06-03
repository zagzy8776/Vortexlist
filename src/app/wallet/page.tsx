import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { LogoutButton } from "@/components/logout-button";
import { getCurrentSession } from "@/lib/auth";
import { formatNairaFromKobo } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export default async function WalletPage() {
  const session = await getCurrentSession();

  if (!session?.user) redirect("/signin");

  const wallet = await prisma.wallet.findUnique({ where: { userId: session.user.id } });

  return (
    <main className="min-h-screen bg-[#07111F] px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-white">Wallet</h1>
            <p className="mt-2 text-slate-400">Fund your wallet, track transactions and pay for services faster.</p>
          </div>
          <LogoutButton />
        </div>
        <DashboardNav />
        <section className="mt-8 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="glass-panel rounded-3xl p-6">
            <p className="text-sm font-bold text-cyan-300">Available balance</p>
            <p className="mt-4 text-5xl font-black text-white">{formatNairaFromKobo(wallet?.balanceKobo ?? 0)}</p>
            <button className="mt-6 w-full rounded-2xl bg-cyan-400 px-5 py-4 font-black text-slate-950 opacity-70" type="button">Add funds soon</button>
            <p className="mt-3 text-sm text-slate-400">Secure wallet funding is being connected next.</p>
          </div>
          <div className="glass-panel rounded-3xl p-6">
            <h2 className="text-2xl font-black text-white">Recent transactions</h2>
            <p className="mt-3 text-slate-400">Your deposits, purchases and refunds will appear here.</p>
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-6 text-center text-slate-400">No wallet activity yet.</div>
          </div>
        </section>
      </div>
    </main>
  );
}