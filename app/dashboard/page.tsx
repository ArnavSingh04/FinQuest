"use client";

import { useEffect } from "react";
import Link from "next/link";

import { SpendingForm } from "@/components/spending/SpendingForm";
import { useGameStore } from "@/store/useGameStore";
import type { Proportions } from "@/types";

function pct(v: number) {
  return `${Math.round(v * 100)}%`;
}

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <p className={`text-xs font-semibold uppercase tracking-widest ${color}`}>{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function HealthBar({ score }: { score: number }) {
  const color =
    score > 75 ? "bg-emerald-400" :
    score > 50 ? "bg-sky-400" :
    score > 30 ? "bg-amber-400" : "bg-red-400";

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-200">City Health</p>
        <span className="text-2xl font-bold text-white">{score}</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-slate-400">
        {score > 75 ? "☀️ Thriving" : score > 50 ? "⛅ Stable" : score > 30 ? "🌧 At risk" : "⛈ Critical"}
      </p>
    </div>
  );
}

async function fetchAdvisorMessage(proportions: Proportions): Promise<string> {
  const res = await fetch("/api/insight", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(proportions),
  });
  if (!res.ok) throw new Error("Advisor unavailable");
  const data = (await res.json()) as { insight: string };
  return data.insight;
}

export default function DashboardPage() {
  const { proportions, cityState, advisorMessage, isAdvisorLoading, loadFromStorage, setAdvisorMessage, setAdvisorLoading } =
    useGameStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  async function handleSubmitted(updatedProportions: Proportions) {
    setAdvisorLoading(true);
    try {
      const msg = await fetchAdvisorMessage(updatedProportions);
      setAdvisorMessage(msg);
    } catch {
      // fallback stays
    } finally {
      setAdvisorLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 py-6 sm:max-w-6xl sm:px-6">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">FinQuest</p>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Your City Dashboard</h1>
        </div>
        <Link
          href="/city"
          className="shrink-0 rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/5"
        >
          Open City →
        </Link>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left column */}
        <div className="flex flex-col gap-5">
          <SpendingForm onSubmitted={handleSubmitted} />

          {/* AI Advisor */}
          <div className="glass-card rounded-[2rem] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">AI Advisor</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {isAdvisorLoading ? (
                <span className="animate-pulse">Analysing your spending…</span>
              ) : (
                advisorMessage
              )}
            </p>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Health */}
          <HealthBar score={cityState.healthScore} />

          {/* Weather badge */}
          <div className="glass-card rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">City Weather</p>
            <p className="mt-1 text-lg font-semibold capitalize text-white">{cityState.weather}</p>
          </div>

          {/* Proportions */}
          <div className="grid grid-cols-2 gap-3">
            <StatPill label="Needs" value={pct(proportions.needs)} color="text-sky-300" />
            <StatPill label="Wants" value={pct(proportions.wants)} color="text-orange-300" />
            <StatPill label="Treats" value={pct(proportions.treats)} color="text-pink-300" />
            <StatPill label="Invest" value={pct(proportions.investments)} color="text-emerald-300" />
          </div>

          {/* City metrics */}
          <div className="grid grid-cols-2 gap-3">
            <StatPill label="Bank height" value={cityState.bankHeight.toFixed(1)} color="text-blue-300" />
            <StatPill label="Restaurants" value={String(cityState.restaurantCount)} color="text-orange-300" />
            <StatPill label="Apartments" value={String(cityState.apartmentCount)} color="text-slate-300" />
            <StatPill label="Population" value={String(cityState.population)} color="text-emerald-300" />
          </div>
        </div>
      </div>
    </main>
  );
}
