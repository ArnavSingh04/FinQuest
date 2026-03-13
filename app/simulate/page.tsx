"use client";

import { useState, useMemo } from "react";
import { CityCanvas } from "@/components/city/CityFullscreen";
import { generateCityState } from "@/lib/cityEngine";
import { getCityTier } from "@/lib/cityLevel";
import type { Proportions } from "@/types";

const WEATHER_EMOJI: Record<string, string> = {
  thriving: "✨", clear: "☀️", overcast: "⛅", rain: "🌧", storm: "⛈", destruction: "💥",
};

const SLIDERS = [
  { key: "needs"       as const, label: "🏠 Needs",   color: "accent-sky-400",     barColor: "bg-sky-400",     tip: "Rent, groceries, utilities" },
  { key: "wants"       as const, label: "🍕 Wants",   color: "accent-orange-400",  barColor: "bg-orange-400",  tip: "Dining, streaming, hobbies" },
  { key: "treats"      as const, label: "🛍️ Treats",  color: "accent-pink-400",    barColor: "bg-pink-400",    tip: "Impulse buys, luxuries" },
  { key: "investments" as const, label: "📈 Invest",  color: "accent-emerald-400", barColor: "bg-emerald-400", tip: "Savings, ETFs, shares" },
];

const RULE_TARGETS = { needs: 50, wants: 30, treats: 0, investments: 20 };

export default function SimulatePage() {
  const [values, setValues] = useState({ needs: 50, wants: 20, treats: 10, investments: 20 });

  const total = values.needs + values.wants + values.treats + values.investments;

  const proportions: Proportions = useMemo(() => ({
    needs:       values.needs / 100,
    wants:       values.wants / 100,
    treats:      values.treats / 100,
    investments: values.investments / 100,
  }), [values]);

  const cityState = useMemo(() => generateCityState(proportions), [proportions]);
  const tier = getCityTier(cityState.healthScore);

  const override = useMemo(() => ({ cityState, proportions }), [cityState, proportions]);

  function setSlider(key: keyof typeof values, raw: number) {
    // Clamp remaining to 0 when total would exceed 100
    const others = total - values[key];
    const clamped = Math.min(raw, 100 - others);
    setValues((prev) => ({ ...prev, [key]: Math.max(0, clamped) }));
  }

  const remaining = 100 - total;

  return (
    <main className="page-with-nav mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">FinQuest</p>
        <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">What-If Simulator</h1>
        <p className="mt-1 text-sm text-slate-400">Drag the sliders to see how different spending habits shape your city — no real data used.</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        {/* Left — 3D preview */}
        <div className="flex flex-col gap-4">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl h-[46vh] min-h-[280px] sm:h-[420px]">
            <CityCanvas className="w-full h-full" preset={null} override={override} />
            {/* Health overlay */}
            <div className="absolute top-3 left-3 rounded-2xl border border-white/15 bg-black/60 backdrop-blur-sm px-3 py-2">
              <p className={`text-2xl font-black ${tier.color}`}>{cityState.healthScore}</p>
              <p className="text-[10px] text-slate-400">Health Score</p>
            </div>
            <div className="absolute top-3 right-3 rounded-2xl border border-white/15 bg-black/60 backdrop-blur-sm px-3 py-2 text-center">
              <p className="text-lg">{WEATHER_EMOJI[cityState.weather]}</p>
              <p className={`text-[10px] font-bold ${tier.color}`}>{tier.name}</p>
            </div>
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: "Population", value: `${cityState.population * 100}k` },
              { label: "Restaurants", value: String(cityState.restaurantCount) },
              { label: "Apartments", value: String(cityState.apartmentCount) },
            ].map(({ label, value }) => (
              <div key={label} className="glass-card rounded-2xl p-3 text-center">
                <p className="text-[11px] text-slate-500">{label}</p>
                <p className="mt-0.5 text-base font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — sliders */}
        <div className="flex flex-col gap-4">
          <div className="glass-card rounded-3xl p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Spending Allocation</p>
              <span className={`text-xs font-bold ${remaining < 0 ? "text-red-400" : remaining === 0 ? "text-emerald-400" : "text-slate-400"}`}>
                {remaining < 0 ? `⚠️ Over by ${-remaining}%` : remaining === 0 ? "✓ 100%" : `${remaining}% unallocated`}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-4">Sliders cap at 100% total. Drag to see your city react live.</p>

            <div className="flex flex-col gap-5">
              {SLIDERS.map(({ key, label, color, barColor, tip }) => {
                const val = values[key];
                const target = RULE_TARGETS[key];
                const pass = key === "treats"
                  ? val <= 10
                  : key === "investments"
                    ? val >= target
                    : val <= target;

                return (
                  <div key={key}>
                    <div className="flex justify-between mb-1.5">
                      <div>
                        <span className="text-sm font-semibold text-white">{label}</span>
                        <span className="ml-2 text-[10px] text-slate-500">{tip}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {target > 0 && (
                          <span className={`text-[10px] ${pass ? "text-emerald-400" : "text-amber-400"}`}>
                            {key === "investments" ? `≥${target}%` : `≤${target}%`} {pass ? "✓" : "!"}
                          </span>
                        )}
                        <span className={`text-sm font-bold ${barColor.replace("bg-", "text-")}`}>{val}%</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={val}
                      onChange={(e) => setSlider(key, Number(e.target.value))}
                      className={`w-full h-2 rounded-full ${color}`}
                    />
                    <div className="relative mt-1 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div className={`h-full rounded-full ${barColor} opacity-60`} style={{ width: `${val}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Insight message */}
          <div className={`glass-card rounded-3xl p-4 border ${
            cityState.healthScore >= 70 ? "border-emerald-500/20" :
            cityState.healthScore >= 40 ? "border-amber-500/20" : "border-red-500/20"
          }`}>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">City Forecast</p>
            <p className="text-sm text-slate-300">
              {cityState.healthScore >= 88
                ? `✨ Perfect allocation! Investing ${values.investments}% while keeping needs covered — your city would be a Utopia.`
                : cityState.healthScore >= 70
                  ? `☀️ Strong habits. With ${values.investments}% invested and needs at ${values.needs}%, your city would thrive.`
                  : cityState.healthScore >= 50
                    ? `⛅ Decent start. Try boosting investments above 20% and keeping treats under 10%.`
                    : cityState.healthScore >= 30
                      ? `🌧 High treats (${values.treats}%) are bringing storms. Cut impulse spending to see clear skies.`
                      : `⛈ Critical pattern. Overspending on treats and under-investing leads to destruction. Flip the balance.`}
            </p>
          </div>

          {/* 50/30/20 quick eval */}
          <div className="glass-card rounded-3xl p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">50/30/20 Check</p>
            <div className="flex flex-col gap-1.5">
              {[
                { label: "Needs ≤ 50%",  pass: values.needs <= 50,                          actual: values.needs },
                { label: "Wants ≤ 30%",  pass: values.wants + values.treats <= 30,           actual: values.wants + values.treats },
                { label: "Invest ≥ 20%", pass: values.investments >= 20,                     actual: values.investments },
              ].map(({ label, pass, actual }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={`text-sm ${pass ? "text-emerald-400" : "text-amber-400"}`}>{pass ? "✓" : "✗"}</span>
                  <span className="text-xs text-slate-300 flex-1">{label}</span>
                  <span className="text-xs text-slate-500">{actual}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
