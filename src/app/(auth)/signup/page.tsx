import Link from "next/link";

export default function SignUpPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#7c3aed_0,transparent_32%),#07111F] px-6 py-12">
      <div className="glass-panel w-full max-w-md rounded-[2rem] p-8">
        <Link href="/" className="mb-8 inline-flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-cyan-400 font-black text-slate-950">V</span>
          <span className="text-xl font-bold">VortexList</span>
        </Link>
        <h1 className="text-3xl font-black text-white">Create account</h1>
        <p className="mt-2 text-slate-400">Start buying global proxies and numbers from one wallet.</p>
        <form className="mt-8 space-y-4">
          <input className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-white outline-none focus:border-cyan-300" placeholder="Full name" />
          <input className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-white outline-none focus:border-cyan-300" placeholder="Email address" type="email" />
          <input className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-white outline-none focus:border-cyan-300" placeholder="Password" type="password" />
          <button className="w-full rounded-2xl bg-cyan-400 px-5 py-4 font-black text-slate-950 hover:bg-cyan-300" type="button">Create account</button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">Already have an account? <Link className="font-bold text-cyan-300" href="/signin">Sign in</Link></p>
      </div>
    </main>
  );
}