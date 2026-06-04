import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { SupportTicketForm } from "@/components/support-ticket-form";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SupportPage() {
  const session = await getCurrentSession();

  if (!session?.user) redirect("/signin");

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <main className="min-h-screen bg-[#07111F] px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-black text-white">Support</h1>
        <p className="mt-2 text-slate-400">Get help with wallet funding, orders and delivery.</p>
        <DashboardNav />
        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="glass-panel rounded-3xl p-6">
          <h2 className="text-2xl font-black text-white">Need help?</h2>
            <p className="mt-3 text-slate-400">Create a ticket for wallet funding, orders, proxy delivery or phone number SMS issues.</p>
            <SupportTicketForm />
          </div>
          <div className="glass-panel rounded-3xl p-6">
            <h2 className="text-2xl font-black text-white">Your tickets</h2>
            {tickets.length > 0 ? (
              <div className="mt-6 space-y-3">
                {tickets.map((ticket) => (
                  <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4" key={ticket.id}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-white">{ticket.subject}</p>
                        <p className="mt-1 text-xs text-slate-500">#{ticket.id.slice(0, 8)} · {ticket.createdAt.toLocaleString()}</p>
                      </div>
                      <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">{ticket.status.replaceAll("_", " ")}</span>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-slate-300">{ticket.message}</p>
                    {ticket.adminNote ? <p className="mt-3 rounded-xl bg-cyan-400/10 p-3 text-sm font-semibold text-cyan-100">Support note: {ticket.adminNote}</p> : null}
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-6 text-center text-slate-400">No support tickets yet.</div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}