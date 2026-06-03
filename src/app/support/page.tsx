import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { getCurrentSession } from "@/lib/auth";

export default async function SupportPage() {
  const session = await getCurrentSession();

  if (!session?.user) redirect("/signin");

  return (
    <main className="min-h-screen bg-[#07111F] px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-black text-white">Support</h1>
        <p className="mt-2 text-slate-400">Get help with wallet funding, orders and delivery.</p>
        <DashboardNav />
        <section className="mt-8 glass-panel rounded-3xl p-6">
          <h2 className="text-2xl font-black text-white">Need help?</h2>
          <p className="mt-3 text-slate-400">Support tickets and live chat will be connected here. For now, contact support through the official VortexList contact channel.</p>
        </section>
      </div>
    </main>
  );
}