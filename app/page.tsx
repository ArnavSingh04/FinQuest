import Link from "next/link";

const FEATURES = [
  {
    icon: "🏠",
    title: "Needs",
    sub: "Housing district",
    desc: "Essentials like rent, groceries, and utilities build your apartment blocks.",
    color: "from-sky-500/20 to-sky-600/10 border-sky-500/30",
    tag: "sky",
  },
  {
    icon: "🍕",
    title: "Wants",
    sub: "Entertainment strip",
    desc: "Lifestyle spending lights up the restaurant and commercial district.",
    color: "from-orange-500/20 to-orange-600/10 border-orange-500/30",
    tag: "orange",
  },
  {
    icon: "🛍️",
    title: "Treats",
    sub: "Pollution clouds",
    desc: "Impulse buys cause visible smog — the city literally suffers.",
    color: "from-pink-500/20 to-pink-600/10 border-pink-500/30",
    tag: "pink",
  },
  {
    icon: "📈",
    title: "Invest",
    sub: "Financial skyline",
    desc: "Every dollar saved grows the glass towers in your financial district.",
    color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
    tag: "emerald",
  },
];

const STATS = [
  { value: "0", unit: "dollars stored", label: "Privacy-safe by design" },
  { value: "1", unit: "tap to log", label: "Friction-free tracking" },
  { value: "4", unit: "categories", label: "Need · Want · Treat · Invest" },
];

export default function HomePage() {
  return (
    <main className="page-with-nav mx-auto w-full max-w-6xl px-5 py-10 sm:py-16">

      {/* ── Hero ── */}
      <section className="mb-16 text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-sky-300">
          ⬡ Financial literacy · reimagined
        </div>

        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-7xl">
          Your money builds{" "}
          <span className="gradient-text">your city</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">
          Every purchase you make shapes a living 3D skyline. Spend wisely and
          watch gleaming towers rise. Overspend on impulses and storm clouds
          roll in. FinQuest makes financial habits <em className="text-slate-200 not-italic">impossible to ignore</em>.
        </p>

        <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-400 px-7 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-sky-500/20 transition hover:opacity-90 hover:shadow-sky-500/40"
          >
            Start Building ✚
          </Link>
          <Link
            href="/city"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            View My City ⬡
          </Link>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="mb-16 grid grid-cols-3 gap-4">
        {STATS.map(({ value, unit, label }) => (
          <div key={label} className="glass-card rounded-2xl p-5 text-center card-hover">
            <p className="text-3xl font-extrabold text-white sm:text-4xl">
              {value}
              <span className="ml-1 text-lg font-medium text-slate-400">{unit}</span>
            </p>
            <p className="mt-1.5 text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </section>

      {/* ── How it works ── */}
      <section className="mb-16">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-400">How it works</p>
          <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Four categories. One living city.</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon, title, sub, desc, color }) => (
            <div
              key={title}
              className={`glass-card card-hover rounded-3xl border bg-gradient-to-br p-5 ${color}`}
            >
              <div className="mb-3 text-3xl">{icon}</div>
              <p className="text-base font-bold text-white">{title}</p>
              <p className="text-xs font-medium text-slate-400">{sub}</p>
              <p className="mt-3 text-sm leading-6 text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Demo flow ── */}
      <section className="mb-16">
        <div className="glass-card rounded-[2rem] p-8 sm:p-12">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">The 3-step loop</p>
              <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Log · Watch · Improve</h2>
              <div className="mt-8 flex flex-col gap-6">
                {[
                  { n: "01", t: "Log a transaction", d: "Tap a category after any purchase. Done in 3 seconds." },
                  { n: "02", t: "City reacts instantly", d: "Buildings grow, shrink, or storm clouds appear — no refresh needed." },
                  { n: "03", t: "AI advisor coaches you", d: "Get personalised tips based on your spending pattern, not generic advice." },
                ].map(({ n, t, d }) => (
                  <div key={n} className="flex gap-4">
                    <span className="shrink-0 text-2xl font-black text-slate-700">{n}</span>
                    <div>
                      <p className="font-semibold text-white">{t}</p>
                      <p className="mt-0.5 text-sm text-slate-400">{d}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/dashboard"
                className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:opacity-90"
              >
                Get started — it's free ✚
              </Link>
            </div>

            {/* Right: fake city preview card */}
            <div className="glass-card rounded-3xl border border-white/10 p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">City Health</span>
                <span className="rounded-full bg-emerald-500/20 px-3 py-0.5 text-xs font-bold text-emerald-400">☀️ Thriving</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-sky-400 to-emerald-400" />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  { label: "Needs",   val: "52%", color: "text-sky-300" },
                  { label: "Invest",  val: "21%", color: "text-emerald-300" },
                  { label: "Wants",   val: "20%", color: "text-orange-300" },
                  { label: "Treats",  val: "7%",  color: "text-pink-300" },
                ].map(({ label, val, color }) => (
                  <div key={label} className="rounded-2xl border border-white/8 bg-white/4 p-3">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className={`mt-0.5 text-2xl font-bold ${color}`}>{val}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-sky-500/20 bg-sky-500/8 p-4">
                <p className="text-xs font-semibold text-sky-300">AI Advisor</p>
                <p className="mt-1 text-sm text-slate-300">
                  "Your investment tower is climbing — you're on the right track! Keep needs above 50% and you'll see clear skies all week."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Footer ── */}
      <section className="text-center">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          Ready to build your city?
        </h2>
        <p className="mt-3 text-slate-400">No bank accounts. No dollar amounts stored. Just proportions.</p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-400 px-8 py-4 text-sm font-bold text-slate-950 shadow-lg shadow-sky-500/20 transition hover:opacity-90"
        >
          Start FinQuest ✚
        </Link>
      </section>
    </main>
  );
}
