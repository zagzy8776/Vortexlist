import Link from "next/link";

const links = [
  ["Overview", "/dashboard"],
  ["Buy numbers", "/numbers"],
  ["Buy proxies", "/proxies"],
  ["Wallet", "/wallet"],
  ["Orders", "/orders"],
  ["Support", "/support"],
];

export function DashboardNav() {
  return (
    <nav className="mt-6 flex gap-2 overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.03] p-2">
      {links.map(([label, href]) => (
        <Link key={href} href={href} className="whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white">
          {label}
        </Link>
      ))}
    </nav>
  );
}