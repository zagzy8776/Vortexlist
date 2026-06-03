"use client";

import { signOut } from "next-auth/react";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  return (
    <button
      className="rounded-full border border-white/10 px-5 py-2.5 text-sm font-bold text-slate-200 transition hover:bg-white/10"
      onClick={() => signOut({ callbackUrl: "/signin" })}
      type="button"
    >
      {compact ? "Exit" : "Logout"}
    </button>
  );
}