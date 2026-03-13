"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { CityHeader } from "@/components/city/CityHeader";
import { CityScene } from "@/components/city/CityScene";
import { SpendingForm } from "@/components/spending/SpendingForm";
import { useGameStore } from "@/store/useGameStore";
import { encodeCityShare } from "@/lib/cityShare";
import { getCityTier } from "@/lib/cityLevel";
import type { Proportions } from "@/types";

const LEGEND = [
  { icon: "🏠", label: "Apartments", desc: "Grow with Needs spending", color: "text-sky-300" },
  { icon: "🍕", label: "Restaurants", desc: "Grow with Wants spending", color: "text-orange-300" },
  { icon: "🏦", label: "Bank tower", desc: "Rises with Investments", color: "text-blue-300" },
  { icon: "💹", label: "Hex tower", desc: "Scales with Investments", color: "text-emerald-300" },
  { icon: "☁️", label: "Smog clouds", desc: "Appear with Treat overspend", color: "text-pink-300" },
];

const WEATHER_EMOJI: Record<string, string> = {
  thriving: "✨", clear: "☀️", overcast: "⛅", rain: "🌧", storm: "⛈", destruction: "💥",
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
  const { cityState, proportions, advisorMessage, isAdvisorLoading, cityName, loadFromStorage, setAdvisorMessage, setAdvisorLoading } =
    useGameStore();
  const [copied, setCopied] = useState(false);

  useEffect(() => { loadFromStorage(); }, [loadFromStorage]);

  function handleShare() {
    const code = encodeCityShare({ name: cityName, props: proportions, city: cityState });
    const url = `${window.location.origin}/city/view?c=${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

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

  const tier = getCityTier(cityState.healthScore);

  return (
    <main className="page-with-nav mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-5 flex items-center justify-between gap-4">
        <CityHeader />
        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className={`shrink-0 rounded-2xl border px-4 py-2 text-sm font-medium transition ${
              copied
                ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                : "border-white/10 bg-white/5 text-white hover:bg-white/10"
            }`}
          >
            {copied ? "✓ Copied!" : "🔗 Share City"}
          </button>
          <Link
            href="/dashboard"
            className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Dashboard →
          </Link>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        {/* Left — canvas + stats */}
        <div className="flex flex-col gap-4">
          <CityScene height="h-[46vh] min-h-[280px] sm:h-[520px]" />

          {/* Stats strip */}
          <div className="grid grid-cols-4 gap-2.5">
            {[
              { label: "Health", value: cityState.healthScore, sub: tier.name, subColor: tier.color },
              { label: "Weather", value: WEATHER_EMOJI[cityState.weather] ?? cityState.weather, sub: cityState.weather, capitalize: true },
              { label: "Population", value: `${cityState.population * 100}k`, sub: "residents" },
              { label: "Restaurants", value: String(cityState.restaurantCount), sub: "open" },
            ].map(({ label, value, sub, capitalize, subColor }) => (
              <div key={label} className="glass-card rounded-2xl p-3 text-center">
                <p className="text-[11px] text-slate-500">{label}</p>
                <p className={`mt-0.5 text-base font-bold text-white ${capitalize ? "capitalize" : ""}`}>{value}</p>
                <p className={`text-[10px] capitalize ${subColor ?? "text-slate-500"}`}>{sub}</p>
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
