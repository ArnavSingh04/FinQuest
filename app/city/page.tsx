"use client";

import { useEffect } from "react";
import Link from "next/link";

import { CityScene } from "@/components/city/CityScene";
import { SpendingForm } from "@/components/spending/SpendingForm";
import { useGameStore } from "@/store/useGameStore";
import type { Proportions } from "@/types";

const LEGEND = [
  { icon: "🏠", label: "Apartments", desc: "Grow with Needs spending", color: "text-sky-300" },
  { icon: "🍕", label: "Restaurants", desc: "Grow with Wants spending", color: "text-orange-300" },
  { icon: "🏦", label: "Bank tower", desc: "Rises with Investments", color: "text-blue-300" },
  { icon: "💹", label: "Hex tower", desc: "Scales with Investments", color: "text-emerald-300" },
  { icon: "☁️", label: "Smog clouds", desc: "Appear with Treat overspend", color: "text-pink-300" },
];

const WEATHER_EMOJI: Record<string, string> = {
  clear: "☀️", overcast: "⛅", rain: "🌧", storm: "⛈",
};

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

export default function CityPage() {
  const { cityState, advisorMessage, isAdvisorLoading, loadFromStorage, setAdvisorMessage, setAdvisorLoading } =
    useGameStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  async function handleSubmitted(proportions: Proportions) {
    setAdvisorLoading(true);
    try {
      const msg = await fetchAdvisorMessage(proportions);
      setAdvisorMessage(msg);
    } catch {
      // ignore
    } finally {
      setAdvisorLoading(false);
    }
  }

  const healthLabel =
    cityState.healthScore > 75 ? "Thriving" :
    cityState.healthScore > 50 ? "Stable" :
    cityState.healthScore > 30 ? "At risk" : "Critical";

  return (
    <main className="page-with-nav mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">FinQuest</p>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Your 3D City</h1>
        </div>
        <Link
          href="/dashboard"
          className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
        >
          Dashboard →
        </Link>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        {/* Left — canvas + stats */}
        <div className="flex flex-col gap-4">
          <CityScene height="h-[46vh] min-h-[280px] sm:h-[520px]" />

          {/* Stats strip */}
          <div className="grid grid-cols-4 gap-2.5">
            {[
              { label: "Health", value: cityState.healthScore, sub: healthLabel },
              { label: "Weather", value: WEATHER_EMOJI[cityState.weather] ?? cityState.weather, sub: cityState.weather, capitalize: true },
              { label: "Population", value: `${cityState.population * 100}k`, sub: "residents" },
              { label: "Restaurants", value: String(cityState.restaurantCount), sub: "open" },
            ].map(({ label, value, sub, capitalize }) => (
              <div key={label} className="glass-card rounded-2xl p-3 text-center">
                <p className="text-[11px] text-slate-500">{label}</p>
                <p className={`mt-0.5 text-base font-bold text-white ${capitalize ? "capitalize" : ""}`}>{value}</p>
                <p className={`text-[10px] capitalize text-slate-500`}>{sub}</p>
              </div>
            ))}
          </div>

          {/* AI Advisor */}
          <div className="glass-card rounded-3xl p-4 border border-sky-500/15">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-sky-400 to-emerald-400 flex items-center justify-center text-[10px] font-bold text-slate-950">
                AI
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-sky-300">City Advisor</span>
              {isAdvisorLoading && <span className="ml-auto text-xs text-slate-500 animate-pulse">thinking…</span>}
            </div>
            <p className="text-sm leading-6 text-slate-300">
              {isAdvisorLoading ? (
                <span className="animate-pulse">Analysing your city…</span>
              ) : advisorMessage}
            </p>
          </div>
        </div>

        {/* Right — form + legend */}
        <div className="flex flex-col gap-4">
          <SpendingForm onSubmitted={handleSubmitted} />

          {/* Building legend */}
          <div className="glass-card rounded-3xl p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">City Guide</p>
            <div className="flex flex-col gap-2.5">
              {LEGEND.map(({ icon, label, desc, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-lg w-7 text-center shrink-0">{icon}</span>
                  <div>
                    <p className={`text-xs font-semibold ${color}`}>{label}</p>
                    <p className="text-[11px] text-slate-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
