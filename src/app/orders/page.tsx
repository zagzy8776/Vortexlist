import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { LogoutButton } from "@/components/logout-button";
import { getCurrentSession } from "@/lib/auth";
import { formatNairaFromKobo } from "@/lib/money";
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
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                    <div>
                      <p className="font-bold text-white">Order #{order.id.slice(0, 8)}</p>
                      <p className="mt-1 text-sm text-slate-400">Status: {order.status}</p>
                      <p className="mt-1 text-sm text-slate-400">Total: {formatNairaFromKobo(order.totalKobo)}</p>
                    </div>
                    <OrderDelivery meta={order.providerMeta} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function OrderDelivery({ meta }: { meta: unknown }) {
  const data = meta as {
    product?: { name?: string; country?: string };
    delivery?: { phoneNumber?: string; service?: string; operator?: string; status?: string; expiresAt?: string; proxyHost?: string; proxyPort?: number; httpPort?: number; socksPort?: number; username?: string; password?: string; sms?: Array<{ sender?: string; text?: string; code?: string; receivedAt?: string }> } | Array<{ proxyHost?: string; httpPort?: number; socksPort?: number; username?: string; password?: string; expiresAt?: string }>;
  } | null;

  if (!data?.delivery) {
    return null;
  }

  if (Array.isArray(data.delivery)) {
    return (
      <div className="space-y-3">
        {data.delivery.map((delivery, index) => (
          <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-4 text-sm" key={`${delivery.proxyHost}-${index}`}>
            <p className="font-black text-white">{data.product?.name ?? "Proxy access"}</p>
            <p className="mt-2 text-slate-300">Host: {delivery.proxyHost}</p>
            <p className="text-slate-300">HTTP Port: {delivery.httpPort}</p>
            <p className="text-slate-300">SOCKS Port: {delivery.socksPort}</p>
            <p className="text-slate-300">Username: {delivery.username}</p>
            <p className="text-slate-300">Password: {delivery.password}</p>
            {delivery.expiresAt ? <p className="text-slate-300">Expires: {delivery.expiresAt}</p> : null}
          </div>
        ))}
      </div>
    );
  }

  if (data.delivery.phoneNumber) {
    return (
      <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-4 text-sm">
        <p className="font-black text-white">{data.product?.name ?? "Phone number access"}</p>
        <p className="mt-2 text-slate-300">Number: {data.delivery.phoneNumber}</p>
        <p className="text-slate-300">Service: {data.delivery.service}</p>
        <p className="text-slate-300">Operator: {data.delivery.operator}</p>
        <p className="text-slate-300">Status: {data.delivery.status}</p>
        {data.delivery.expiresAt ? <p className="text-slate-300">Expires: {data.delivery.expiresAt}</p> : null}
        {data.delivery.sms?.length ? (
          <div className="mt-3 rounded-xl bg-slate-950/40 p-3">
            <p className="font-bold text-white">SMS messages</p>
            {data.delivery.sms.map((sms, index) => (
              <div className="mt-2 text-slate-300" key={`${sms.receivedAt}-${index}`}>
                <p>Code: {sms.code ?? "Pending"}</p>
                <p>Text: {sms.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-slate-400">Waiting for SMS code. Refresh this page after the message arrives.</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-4 text-sm">
      <p className="font-black text-white">{data.product?.name ?? "Service access"}</p>
      <p className="mt-2 text-slate-300">Host: {data.delivery.proxyHost}</p>
      <p className="text-slate-300">Port: {data.delivery.proxyPort ?? data.delivery.httpPort}</p>
      <p className="text-slate-300">Username: {data.delivery.username}</p>
      <p className="text-slate-300">Password: {data.delivery.password}</p>
    </div>
  );
}