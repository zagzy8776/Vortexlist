import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { LogoutButton } from "@/components/logout-button";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function OrdersPage() {
  const session = await getCurrentSession();

  if (!session?.user) redirect("/signin");

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <main className="min-h-screen bg-[#07111F] px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-white">Orders</h1>
            <p className="mt-2 text-slate-400">Track purchases, delivery status and service history.</p>
          </div>
          <LogoutButton />
        </div>
        <DashboardNav />
        <section className="mt-8 glass-panel rounded-3xl p-6">
          {orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-400">No orders yet. Start by buying numbers or proxies.</div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4" key={order.id}>
                  <p className="font-bold text-white">Order #{order.id.slice(0, 8)}</p>
                  <p className="mt-1 text-sm text-slate-400">Status: {order.status}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}