"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const statuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export function AdminTicketActions({ ticketId, currentStatus, currentNote }: { ticketId: string; currentStatus: string; currentNote?: string | null }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [adminNote, setAdminNote] = useState(currentNote ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/support/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, status, adminNote }),
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setError(data.message ?? "Unable to update ticket.");
        return;
      }

      router.refresh();
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
      <select className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-300" onChange={(event) => setStatus(event.target.value)} value={status}>
        {statuses.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
      </select>
      <textarea
        className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-cyan-300"
        maxLength={2000}
        onChange={(event) => setAdminNote(event.target.value)}
        placeholder="Admin note visible to support staff and customer"
        value={adminNote}
      />
      {error ? <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200">{error}</p> : null}
      <button className="rounded-full bg-cyan-400 px-4 py-2 text-xs font-black text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60" disabled={loading} type="submit">
        {loading ? "Updating..." : "Update ticket"}
      </button>
    </form>
  );
}