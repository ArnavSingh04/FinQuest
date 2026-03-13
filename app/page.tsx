import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10 sm:max-w-6xl">
      <section className="glass-card rounded-[2rem] p-6 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
          Financial Literacy PWA
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-6xl">
          FinQuest
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
          Track spending, convert your money habits into city metrics, and make
          smarter decisions with AI-powered coaching built for teens.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-400 px-5 py-3 text-center text-sm font-semibold text-slate-950"
          >
            Start Tracking
          </Link>
          <Link
            href="/city"
            className="rounded-2xl border border-white/10 px-5 py-3 text-center text-sm font-semibold text-white"
          >
            View My City
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <p className="text-sm font-medium text-slate-200">Log spending</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Record a purchase in seconds from a phone-friendly form.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <p className="text-sm font-medium text-slate-200">See city changes</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Needs, wants, treats, and investing change the skyline instantly.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <p className="text-sm font-medium text-slate-200">Get AI advice</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Turn raw ratios into simple coaching a teenager can actually use.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
