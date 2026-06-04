"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export function RefreshNumberOrderButton({ autoRefresh = false, orderId }: { autoRefresh?: boolean; orderId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const refreshOrder = useCallback(async () => {
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
  }, [orderId, router]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = window.setInterval(() => {
      refreshOrder();
    }, 20_000);

    return () => window.clearInterval(interval);
  }, [autoRefresh, orderId, refreshOrder]);

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
      {autoRefresh ? <p className="mt-2 text-[11px] font-semibold text-cyan-100">Auto-refreshing every 20 seconds while SMS is pending.</p> : null}
      {error ? <p className="mt-2 rounded-xl bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200">{error}</p> : null}
    </div>
  );
}