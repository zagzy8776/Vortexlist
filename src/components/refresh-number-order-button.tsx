"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RefreshNumberOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function refreshOrder() {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/orders/number/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setError(data.message ?? "Unable to refresh SMS status.");
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
    <div className="mt-3">
      <button
        className="rounded-full bg-cyan-400 px-4 py-2 text-xs font-black text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={loading}
        onClick={refreshOrder}
        type="button"
      >
        {loading ? "Refreshing..." : "Refresh SMS"}
      </button>
      {error ? <p className="mt-2 rounded-xl bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200">{error}</p> : null}
    </div>
  );
}