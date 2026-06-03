import Link from "next/link";

export default async function WalletVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const { reference } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-[#07111F] px-6 py-12">
      <div className="glass-panel w-full max-w-lg rounded-[2rem] p-8 text-center">
        <h1 className="text-3xl font-black text-white">Confirm wallet funding</h1>
        <p className="mt-3 text-slate-400">Your payment was returned to VortexList. Click below to verify and credit your wallet.</p>
        <form action="/api/wallet/deposit/verify" className="mt-6" method="post">
          <input name="reference" type="hidden" value={reference ?? ""} />
        </form>
        <VerifyButton reference={reference} />
        <Link className="mt-5 block text-sm font-bold text-cyan-300" href="/wallet">Back to wallet</Link>
      </div>
    </main>
  );
}

function VerifyButton({ reference }: { reference?: string }) {
  return (
    <Link
      className="mt-6 inline-flex w-full justify-center rounded-2xl bg-cyan-400 px-5 py-4 font-black text-slate-950 hover:bg-cyan-300"
      href={`/wallet/verify/process?reference=${encodeURIComponent(reference ?? "")}`}
    >
      Verify payment
    </Link>
  );
}