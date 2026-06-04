import { redirect } from "next/navigation";
import { AdminTicketActions } from "@/components/admin-ticket-actions";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const adminModules = ["Users", "Orders", "Products", "Countries", "Supply sources", "Pricing rules", "Wallet transactions", "Manual deposits", "System logs"];

export default async function AdminPage() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/signin");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const tickets = await prisma.supportTicket.findMany({
    include: {
      user: {
        select: {
          email: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <main className="min-h-screen bg-[#07111F] px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-black text-white">Admin control center</h1>
        <p className="mt-2 text-slate-400">Manage pricing, supply sources, users, deposits and fulfillment.</p>
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {adminModules.map((module) => (
            <div key={module} className="glass-panel rounded-3xl p-6">
              <h2 className="text-xl font-bold text-white">{module}</h2>
              <p className="mt-2 text-sm text-slate-400">Foundation module ready for backend wiring.</p>
            </div>
          ))}
        </section>
        <section className="mt-8 glass-panel rounded-3xl p-6">
          <h2 className="text-2xl font-black text-white">Support tickets</h2>
          <p className="mt-2 text-slate-400">Review customer issues, update status and leave handling notes.</p>
          {tickets.length > 0 ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {tickets.map((ticket) => (
                <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4" key={ticket.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-white">{ticket.subject}</p>
                      <p className="mt-1 text-xs text-slate-500">{ticket.user.name ?? ticket.user.email} · {ticket.createdAt.toLocaleString()}</p>
                    </div>
                    <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">{ticket.status.replaceAll("_", " ")}</span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-slate-300">{ticket.message}</p>
                  <AdminTicketActions currentNote={ticket.adminNote} currentStatus={ticket.status} ticketId={ticket.id} />
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-6 text-center text-slate-400">No support tickets yet.</div>
          )}
        </section>
      </div>
    </main>
  );
}