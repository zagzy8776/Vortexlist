export default function ResetPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#07111F] px-6 py-12">
      <div className="glass-panel w-full max-w-md rounded-[2rem] p-8">
        <h1 className="text-3xl font-black text-white">Choose new password</h1>
        <p className="mt-2 text-slate-400">This UI is ready for secure reset tokens when backend auth is connected.</p>
        <form className="mt-8 space-y-4">
          <input className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-white outline-none focus:border-cyan-300" placeholder="New password" type="password" />
          <input className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-white outline-none focus:border-cyan-300" placeholder="Confirm password" type="password" />
          <button className="w-full rounded-2xl bg-cyan-400 px-5 py-4 font-black text-slate-950 hover:bg-cyan-300" type="button">Update password</button>
        </form>
      </div>
    </main>
  );
}