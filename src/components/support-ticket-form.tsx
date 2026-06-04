"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function SupportTicketForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subject, setSubject] = useState(searchParams.get("subject") ?? "");
  const [message, setMessage] = useState(searchParams.get("message") ?? "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setError(data.message ?? "Unable to create support ticket.");
        return;
      }

      setSubject("");
      setMessage("");
      setSuccess("Support ticket created. Our team will review it from the admin desk.");
      router.refresh();
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <input
        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-white outline-none focus:border-cyan-300"
        maxLength={120}
        onChange={(event) => setSubject(event.target.value)}
        placeholder="Subject"
        required
        value={subject}
      />
      <textarea
        className="min-h-36 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-white outline-none focus:border-cyan-300"
        maxLength={2000}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Tell us what happened. Include order ID or wallet reference if available."
        required
        value={message}
      />
      {error ? <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">{error}</p> : null}
      {success ? <p className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200">{success}</p> : null}
      <button className="w-full rounded-2xl bg-cyan-400 px-5 py-4 font-black text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60" disabled={loading} type="submit">
        {loading ? "Creating ticket..." : "Create support ticket"}
      </button>
    </form>
  );
}