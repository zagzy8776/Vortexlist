import Link from "next/link";
import { getCurrentSession } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";

const products = [
  {
    title: "Phone numbers + SMS codes",
    description: "Buy verification-ready numbers, track activation status and refresh SMS codes from your orders.",
    metric: "Main product",
  },
  {
    title: "Proxy marketplace",
    description: "Choose datacenter, residential, ISP and mobile proxy access by location, speed and use case.",
    metric: "Fast API delivery",
  },
  {
    title: "eSIM coming soon",
    description: "A future travel-data category with country, regional and global eSIM plans when reseller APIs are ready.",
    metric: "Future-ready",
  },
];

const stats = ["SMS activations", "Wallet checkout", "Global countries", "Code tracking"];

export default async function Home() {
  const session = await getCurrentSession();
  const loggedIn = Boolean(session?.user);

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#1d4ed8_0,transparent_30%),radial-gradient(circle_at_top_right,#7c3aed_0,transparent_28%),#07111F]">
      <AppHeader />

      <main className="mx-auto w-full max-w-7xl px-6 pb-20 pt-10">
        <section className="grid items-center gap-12 py-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-6 inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-200">
              Built first for phone numbers, SMS activations and secure wallet checkout
            </div>
            <h1 className="max-w-4xl text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
              Buy global <span className="gradient-text">phone numbers</span> and receive SMS codes faster.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              VortexList is centered on virtual numbers: fund your wallet, choose a country and service, buy instantly, then manage number delivery and SMS codes from one clean dashboard.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href={loggedIn ? "/numbers" : "/signup"} className="rounded-full bg-blue-600 px-7 py-4 text-center font-bold text-white shadow-xl shadow-blue-900/30 transition hover:bg-blue-500">{loggedIn ? "Buy numbers" : "Start buying numbers"}</Link>
              <Link href="/numbers" className="rounded-full border border-white/15 px-7 py-4 text-center font-bold text-white transition hover:bg-white/10">Browse catalog</Link>
            </div>
            <div className="mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200">{item}</div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="rounded-[1.5rem] bg-slate-950/80 p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Number activation hub</p>
                  <p className="text-3xl font-black text-white">SMS ready</p>
                </div>
                <span className="rounded-full bg-green-400/15 px-3 py-1 text-sm font-bold text-green-300">Live</span>
              </div>
              <div className="space-y-3">
                {products.map((product) => (
                  <div key={product.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-white">{product.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-400">{product.description}</p>
                      </div>
                      <span className="whitespace-nowrap rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">{product.metric}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {[
            ["Service-first catalog", "Pick numbers by country and app service, with simple wallet pricing before checkout."],
            ["Activation tracking", "Purchased numbers stay in your orders with status, expiry and SMS code visibility."],
            ["Secure supplier boundary", "Provider APIs and raw supplier details stay server-side while customers see clean delivery data."],
          ].map(([title, body]) => (
            <div key={title} className="glass-panel rounded-3xl p-6">
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <p className="mt-3 leading-7 text-slate-300">{body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
