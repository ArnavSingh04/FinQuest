"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { FinanceLogsDashboard } from "@/components/dashboard/FinanceLogsDashboard";
import { useAuth } from "@/hooks/useAuth";

const guestNavLinks = [
  { href: "/signup", label: "Log" },
  { href: "/signup", label: "City" },
  { href: "/signup", label: "History" },
  { href: "/signup", label: "Learn" },
  { href: "/signup", label: "Simulate" },
];

const categoryCards = [
  {
    title: "Needs",
    subtitle: "Housing district",
    description:
      "Essentials like rent, groceries, and utilities build your apartment blocks.",
  },
  {
    title: "Wants",
    subtitle: "Entertainment strip",
    description:
      "Lifestyle spending lights up the restaurant and commercial district.",
  },
  {
    title: "Treats",
    subtitle: "Pollution clouds",
    description:
      "Impulse buys cause visible smog so the city literally reacts to your choices.",
  },
  {
    title: "Invest",
    subtitle: "Financial skyline",
    description:
      "Every dollar saved or invested grows the glass towers in your future district.",
  },
];

const loopSteps = [
  {
    id: "01",
    title: "Log a transaction",
    description: "Tap a category after any purchase. Done in a few seconds.",
  },
  {
    id: "02",
    title: "City reacts instantly",
    description:
      "Buildings grow, shrink, or storm clouds appear based on the spending mix.",
  },
  {
    id: "03",
    title: "AI advisor coaches you",
    description:
      "Get personal guidance from your patterns, not generic money advice.",
  },
];

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-6">
        <div className="glass-card rounded-[2rem] p-6 text-slate-300">
          Loading FinQuest...
        </div>
      </main>
    );
  }

  if (user) {
    return <FinanceLogsDashboard />;
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_32%),linear-gradient(180deg,#08111f_0%,#07111f_100%)] text-white">
      <div className="mx-auto w-full max-w-6xl px-5 py-6">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex items-center justify-between gap-4 rounded-[2rem] border border-white/10 bg-slate-950/60 px-5 py-4 backdrop-blur-xl"
        >
          <Link href="/" className="text-xl font-semibold tracking-tight text-white">
            FinQuest
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {guestNavLinks.map((link, index) => (
              <Link
                key={`${link.label}-${index}`}
                href={link.href}
                className="rounded-full px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-2 py-8 text-center"
        >
          <p className="mx-auto inline-flex rounded-full border border-sky-400/20 bg-sky-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-200">
            Financial Literacy · Reimagined
          </p>
          <h1 className="mx-auto mt-8 max-w-5xl text-5xl font-semibold tracking-tight text-white sm:text-7xl">
            Your money builds <span className="text-emerald-300">your city</span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            Every purchase you make shapes a living 3D skyline. Spend wisely and
            watch towers rise. Overspend on impulses and storm clouds roll in.
            FinQuest turns daily money decisions into something you can actually see.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-400 px-8 py-4 text-sm font-semibold text-slate-950 shadow-[0_12px_30px_rgba(34,211,238,0.22)] transition hover:scale-[1.01]"
            >
              Start Building
            </Link>
            <Link
              href="/login"
              className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              View My City
            </Link>
          </div>

          <div className="mt-12 grid gap-4 text-left sm:grid-cols-3">
            <div className="glass-card rounded-[2rem] p-6">
              <p className="text-5xl font-semibold text-white">0</p>
              <p className="mt-2 text-lg text-slate-200">bank links needed</p>
              <p className="mt-2 text-sm text-slate-400">Start with simple manual logs.</p>
            </div>
            <div className="glass-card rounded-[2rem] p-6">
              <p className="text-5xl font-semibold text-white">1</p>
              <p className="mt-2 text-lg text-slate-200">tap to log</p>
              <p className="mt-2 text-sm text-slate-400">Fast, phone-friendly spending input.</p>
            </div>
            <div className="glass-card rounded-[2rem] p-6">
              <p className="text-5xl font-semibold text-white">4</p>
              <p className="mt-2 text-lg text-slate-200">money categories</p>
              <p className="mt-2 text-sm text-slate-400">Need · Want · Treat · Invest</p>
            </div>
          </div>
        </motion.section>

        <section className="mt-10">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.22em] text-sky-300">
            How It Works
          </p>
          <h2 className="mt-4 text-center text-4xl font-semibold text-white sm:text-5xl">
            Four categories. One living city.
          </h2>

          <div className="mt-10 grid gap-5 lg:grid-cols-4">
            {categoryCards.map((card) => (
              <div
                key={card.title}
                className="glass-card rounded-[2rem] p-6"
              >
                <p className="text-2xl font-semibold text-white">{card.title}</p>
                <p className="mt-1 text-sm text-sky-300">{card.subtitle}</p>
                <p className="mt-5 text-sm leading-7 text-slate-300">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card mt-12 grid gap-8 rounded-[2rem] p-6 lg:grid-cols-[1fr_0.95fr] lg:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">
              The 3-Step Loop
            </p>
            <h2 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">
              Log · Watch · Improve
            </h2>

            <div className="mt-10 space-y-8">
              {loopSteps.map((step) => (
                <div key={step.id} className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-4">
                  <p className="text-4xl font-semibold text-slate-700">{step.id}</p>
                  <div>
                    <p className="text-2xl font-semibold text-white">{step.title}</p>
                    <p className="mt-2 text-base leading-7 text-slate-300">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/signup"
              className="mt-10 inline-flex rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-400 px-7 py-4 text-sm font-semibold text-slate-950 shadow-[0_12px_30px_rgba(34,211,238,0.22)] transition hover:scale-[1.01]"
            >
              Get started — it&apos;s free
            </Link>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/35 p-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
                City Health
              </p>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-200">
                Thriving
              </span>
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-sky-400 to-emerald-400" />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-400">Needs</p>
                <p className="mt-2 text-4xl font-semibold text-sky-300">52%</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-400">Invest</p>
                <p className="mt-2 text-4xl font-semibold text-emerald-300">21%</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-400">Wants</p>
                <p className="mt-2 text-4xl font-semibold text-amber-300">20%</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-400">Treats</p>
                <p className="mt-2 text-4xl font-semibold text-rose-300">7%</p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-sky-400/20 bg-sky-500/10 p-5">
              <p className="text-sm font-semibold text-sky-200">AI Advisor</p>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                &quot;Your investment tower is climbing. Keep needs above 50% and
                you&apos;ll see clear skies all week.&quot;
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 text-center">
          <h2 className="text-4xl font-semibold text-white sm:text-5xl">
            Ready to build your city?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            Sign in to start logging transactions, unlock your personal skyline,
            and track how every habit changes your city over time.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-400 px-8 py-4 text-sm font-semibold text-slate-950 shadow-[0_12px_30px_rgba(34,211,238,0.22)] transition hover:scale-[1.01]"
            >
              Start FinQuest
            </Link>
            <Link
              href="/login"
              className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Sign In
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
