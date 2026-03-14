"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { InsightsDashboard } from "@/components/dashboard/InsightsDashboard";
import { useAuth } from "@/hooks/useAuth";

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
    return <InsightsDashboard />;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10 sm:max-w-6xl">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-[2rem] p-6 sm:p-10"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
          Multiplayer Financial Literacy Game
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
            href="/login"
            className="rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-400 px-5 py-3 text-center text-sm font-semibold text-slate-950"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="rounded-2xl border border-white/10 px-5 py-3 text-center text-sm font-semibold text-white"
          >
            Create Account
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <p className="text-sm font-medium text-slate-200">Authenticate</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Every player gets a personal city, progression, and group history.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <p className="text-sm font-medium text-slate-200">Log spending</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Record purchases in seconds from a mobile-friendly spending form.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <p className="text-sm font-medium text-slate-200">Explore your city</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Financial behavior reshapes districts, towers, parks, and pollution.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <p className="text-sm font-medium text-slate-200">Get lessons</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              AI insights and concept cards teach better money habits in plain English.
            </p>
          </div>
        </div>
      </motion.section>
    </main>
  );
}
