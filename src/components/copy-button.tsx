"use client";

import { useState } from "react";

export function CopyButton({ label, value }: { label: string; value: string | number | undefined | null }) {
  const [copied, setCopied] = useState(false);
  const text = value === undefined || value === null ? "" : String(value);

  async function copy() {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      className="rounded-full border border-cyan-300/30 px-3 py-1 text-[11px] font-black text-cyan-100 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={!text}
      onClick={copy}
      type="button"
    >
      {copied ? "Copied" : label}
    </button>
  );
}