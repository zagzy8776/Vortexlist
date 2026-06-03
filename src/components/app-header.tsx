import Link from "next/link";
import { getCurrentSession } from "@/lib/auth";
import { LogoutButton } from "./logout-button";

export async function AppHeader() {
  const session = await getCurrentSession();
  const loggedIn = Boolean(session?.user);

  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
      <Link href="/" className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-cyan-400 text-xl font-black text-slate-950 shadow-lg shadow-cyan-500/30">V</span>
        <span className="text-xl font-bold tracking-tight">VortexList</span>
      </Link>
      <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
        <Link href="/proxies" className="hover:text-white">Proxies</Link>
        <Link href="/numbers" className="hover:text-white">Numbers</Link>
        <Link href="/wallet" className="hover:text-white">Wallet</Link>
        <Link href="/orders" className="hover:text-white">Orders</Link>
      </nav>
      <div className="flex items-center gap-3">
        {loggedIn ? (
          <>
            <Link href="/dashboard" className="rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-300">Dashboard</Link>
            <div className="hidden sm:block"><LogoutButton compact /></div>
          </>
        ) : (
          <>
            <Link href="/signin" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 sm:block">Sign in</Link>
            <Link href="/signup" className="rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-300">Start now</Link>
          </>
        )}
      </div>
    </header>
  );
}