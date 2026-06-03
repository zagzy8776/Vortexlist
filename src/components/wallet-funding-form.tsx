"use client";

import { FormEvent, useState } from "react";

export function WalletFundingForm() {
  const [amount, setAmount] = useState("5000");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/wallet/deposit/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountNaira: Number(amount) }),
    });

    const data = (await response.json()) as { authorizationUrl?: string; message?: string };

    if (!response.ok || !data.authorizationUrl) {
      setError(data.message ?? "Unable to start secure checkout.");
      setLoading(false);
      return;
    }

    window.location.href = data.authorizationUrl;
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <label className="block text-sm font-bold text-slate-300" htmlFor="amount">Amount to add</label>
      <div className="flex rounded-2xl border border-white/10 bg-slate-950/70 focus-within:border-cyan-300">
        <span className="grid place-items-center px-4 font-black text-slate-400">₦</span>
        <input
          className="w-full bg-transparent px-2 py-4 text-white outline-none"
          id="amount"
          min="1000"
          max="1000000"
          name="amount"
          onChange={(event) => setAmount(event.target.value)}
          required
          type="number"
          value={amount}
        />
      </div>
      {error ? <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">{error}</p> : null}
      <button className="w-full rounded-2xl bg-cyan-400 px-5 py-4 font-black text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60" disabled={loading} type="submit">
        {loading ? "Starting secure checkout..." : "Add funds"}
      </button>
    </form>
  );
}