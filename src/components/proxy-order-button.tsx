"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProxyOrderButton({ productId, disabled }: { productId: string; disabled: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function orderProxy() {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/orders/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      const data = (await response.json()) as { message?: string; orderId?: string };

      if (!response.ok || !data.orderId) {
        setError(data.message ?? "Unable to place order.");
        return;
      }

      router.push("/orders");
      router.refresh();
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8">
      <button
        className="w-full rounded-2xl bg-cyan-400 px-5 py-4 font-black text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled || loading}
        onClick={orderProxy}
        type="button"
      >
        {loading ? "Placing order..." : disabled ? "Ordering unavailable" : "Buy with wallet"}
      </button>
      {error ? <p className="mt-3 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">{error}</p> : null}
    </div>
  );
}