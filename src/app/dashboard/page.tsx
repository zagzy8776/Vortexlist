import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";

const cards = [
  ["Wallet", "₦0.00", "Fund your account and buy services faster"],
  ["Active proxies", "0", "Manage your purchased proxy access"],
  ["Phone numbers", "0", "View your purchased numbers and SMS activity"],
  ["Orders", "0", "Track purchases and fulfillment status"],
];

export default async function DashboardPage() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/signin");
  }

  return (
    <main className="min-h-screen bg-[#07111F] px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-black text-white">Customer dashboard</h1>
        <p className="mt-2 text-slate-400">Welcome back, {session.user.name ?? session.user.email}. Browse services, manage your wallet, track orders and get support from one place.</p>
        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {cards.map(([title, value, body]) => (
            <div key={title} className="glass-panel rounded-3xl p-6">
              <p className="text-sm font-semibold text-cyan-300">{title}</p>
              <p className="mt-3 text-3xl font-black text-white">{value}</p>
              <p className="mt-3 text-sm leading-6 text-slate-400">{body}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}