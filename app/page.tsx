"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { CityLayout } from "@/components/layout/CityLayout";
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
      <main className="flex min-h-screen w-full items-center justify-center px-5" style={{ background: "#F2EDE3" }}>
        <div className="rounded-2xl border p-6" style={{ background: "#FFFFFF", borderColor: "#C8BFA8", color: "#4A6358" }}>
          Loading FinCity...
        </div>
      </main>
    );
  }

  if (user) {
    return <CityLayout />;
  }

  return (
    <main className="min-h-screen w-full" style={{ background: "#F2EDE3" }}>
      <div className="mx-auto w-full max-w-6xl px-5 py-6">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="m-3 flex items-center justify-between gap-4 rounded-xl px-5 py-4"
          style={{ background: "#1C3A2E" }}
        >
          <Link href="/" className="font-heading text-xl font-normal tracking-tight" style={{ color: "#F2EDE3" }}>
            FinCity
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {guestNavLinks.map((link, index) => (
              <Link
                key={`${link.label}-${index}`}
                href={link.href}
                className="rounded-full px-3 py-2 text-sm transition hover:opacity-90"
                style={{ color: "#8ABF9E", fontFamily: "var(--font-body), DM Sans, sans-serif", fontSize: 14 }}
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
          <p
            className="mx-auto inline-flex rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em]"
            style={{ background: "#1C3A2E", color: "#F2EDE3", fontFamily: "var(--font-body), DM Sans, sans-serif" }}
          >
            Financial Literacy · Reimagined
          </p>
          <h1 className="mx-auto mt-8 max-w-5xl font-heading text-5xl font-normal tracking-tight sm:text-7xl" style={{ color: "#1C3A2E" }}>
            Your money builds <span style={{ color: "#C17B3F" }}>your city</span>
          </h1>
          <p
            className="mx-auto mt-6 max-w-3xl leading-relaxed"
            style={{ color: "#4A6358", fontFamily: "var(--font-body), DM Sans, sans-serif", fontSize: 16, lineHeight: 1.6 }}
          >
            Every purchase you make shapes a living 3D skyline. Spend wisely and
            watch towers rise. Overspend on impulses and storm clouds roll in.
            FinCity turns daily money decisions into something you can actually see.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-full px-8 py-4 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: "#C17B3F" }}
            >
              Start Building
            </Link>
            <Link
              href="/login"
              className="rounded-full border-2 px-8 py-4 text-sm font-semibold transition hover:opacity-90"
              style={{ borderColor: "#1C3A2E", color: "#1C3A2E", background: "transparent" }}
            >
              View My City
            </Link>
          </div>

          <div className="mt-12 grid gap-4 text-left sm:grid-cols-3">
            <div className="rounded-2xl border p-6" style={{ background: "#FFFFFF", borderColor: "#C8BFA8" }}>
              <p className="font-heading text-5xl font-normal" style={{ color: "#1C3A2E" }}>0</p>
              <p className="mt-2 text-lg" style={{ color: "#4A6358", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>bank links needed</p>
              <p className="mt-2 text-[13px]" style={{ color: "#8A9E94", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>Start with simple manual logs.</p>
            </div>
            <div className="rounded-2xl border p-6" style={{ background: "#FFFFFF", borderColor: "#C8BFA8" }}>
              <p className="font-heading text-5xl font-normal" style={{ color: "#1C3A2E" }}>1</p>
              <p className="mt-2 text-lg" style={{ color: "#4A6358", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>tap to log</p>
              <p className="mt-2 text-[13px]" style={{ color: "#8A9E94", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>Fast, phone-friendly spending input.</p>
            </div>
            <div className="rounded-2xl border p-6" style={{ background: "#FFFFFF", borderColor: "#C8BFA8" }}>
              <p className="font-heading text-5xl font-normal" style={{ color: "#1C3A2E" }}>4</p>
              <p className="mt-2 text-lg" style={{ color: "#4A6358", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>money categories</p>
              <p className="mt-2 text-[13px]" style={{ color: "#8A9E94", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>Need · Want · Treat · Invest</p>
            </div>
          </div>
        </motion.section>

        <section className="mt-10">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "#8A9E94", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>
            How It Works
          </p>
          <h2 className="mt-4 text-center font-heading text-4xl font-normal sm:text-5xl" style={{ color: "#1C3A2E" }}>
            Four categories. One living city.
          </h2>

          <div className="mt-10 grid gap-5 lg:grid-cols-4">
            {categoryCards.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border p-6"
                style={{ background: "#FFFFFF", borderColor: "#C8BFA8" }}
              >
                <p className="font-heading text-2xl font-normal" style={{ color: "#1C3A2E" }}>{card.title}</p>
                <p className="mt-1 text-sm" style={{ color: "#C17B3F", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>{card.subtitle}</p>
                <p className="mt-5 text-sm leading-7" style={{ color: "#4A6358", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-8 rounded-2xl p-6 lg:grid-cols-[1fr_0.95fr] lg:p-8" style={{ background: "#FFFFFF", border: "1px solid #C8BFA8" }}>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "#8A9E94", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>
              The 3-Step Loop
            </p>
            <h2 className="mt-4 font-heading text-4xl font-normal sm:text-5xl" style={{ color: "#1C3A2E" }}>
              Log · Watch · Improve
            </h2>

            <div className="mt-10 space-y-8">
              {loopSteps.map((step) => (
                <div key={step.id} className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-4">
                  <p className="font-heading text-4xl font-normal" style={{ color: "#1C3A2E" }}>{step.id}</p>
                  <div>
                    <p className="font-heading text-2xl font-normal" style={{ color: "#1C3A2E" }}>{step.title}</p>
                    <p className="mt-2 text-base leading-7" style={{ color: "#4A6358", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/signup"
              className="mt-10 inline-flex rounded-full px-7 py-4 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: "#C17B3F" }}
            >
              Get started — it&apos;s free
            </Link>
          </div>

          <div className="rounded-2xl border p-5" style={{ background: "#F2EDE3", borderColor: "#C8BFA8" }}>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold uppercase tracking-[0.08em]" style={{ color: "#4A6358", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>
                City Health
              </p>
              <span className="rounded-full px-3 py-1 text-sm font-semibold" style={{ background: "#E8F7EE", color: "#3DAB6A" }}>
                Thriving
              </span>
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full" style={{ background: "#E8E0D0" }}>
              <div className="h-full w-[78%] rounded-full" style={{ background: "linear-gradient(90deg, #3DAB6A, #C17B3F)" }} />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border p-4" style={{ borderColor: "#C8BFA8", background: "#FFFFFF" }}>
                <p className="text-sm" style={{ color: "#8A9E94", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>Needs</p>
                <p className="mt-2 font-heading text-4xl font-normal" style={{ color: "#1C3A2E" }}>52%</p>
              </div>
              <div className="rounded-2xl border p-4" style={{ borderColor: "#C8BFA8", background: "#FFFFFF" }}>
                <p className="text-sm" style={{ color: "#8A9E94", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>Invest</p>
                <p className="mt-2 font-heading text-4xl font-normal" style={{ color: "#1C3A2E" }}>21%</p>
              </div>
              <div className="rounded-2xl border p-4" style={{ borderColor: "#C8BFA8", background: "#FFFFFF" }}>
                <p className="text-sm" style={{ color: "#8A9E94", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>Wants</p>
                <p className="mt-2 font-heading text-4xl font-normal" style={{ color: "#1C3A2E" }}>20%</p>
              </div>
              <div className="rounded-2xl border p-4" style={{ borderColor: "#C8BFA8", background: "#FFFFFF" }}>
                <p className="text-sm" style={{ color: "#8A9E94", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>Treats</p>
                <p className="mt-2 font-heading text-4xl font-normal" style={{ color: "#1C3A2E" }}>7%</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border p-5" style={{ borderColor: "#C8BFA8", background: "#E8F7EE" }}>
              <p className="text-sm font-semibold" style={{ color: "#1C3A2E", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>AI Advisor</p>
              <p className="mt-3 text-sm leading-7" style={{ color: "#4A6358", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>
                &quot;Your investment tower is climbing. Keep needs above 50% and
                you&apos;ll see clear skies all week.&quot;
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 text-center" style={{ background: "#F2EDE3" }}>
          <h2 className="font-heading text-4xl font-normal sm:text-5xl" style={{ color: "#1C3A2E" }}>
            Ready to build your city?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8" style={{ color: "#4A6358", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>
            Sign in to start logging transactions, unlock your personal skyline,
            and track how every habit changes your city over time.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-full px-8 py-4 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: "#C17B3F" }}
            >
              Start FinCity
            </Link>
            <Link
              href="/login"
              className="rounded-full border-2 px-8 py-4 text-sm font-semibold transition hover:opacity-90"
              style={{ borderColor: "#1C3A2E", color: "#1C3A2E", background: "transparent" }}
            >
              Sign In
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
