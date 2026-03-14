"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { CityCanvas, CityFullscreen, CAMERA_PRESETS } from "@/components/city/CityFullscreen";
import { useGameStore } from "@/store/useGameStore";
import { decodeCityShare } from "@/lib/cityShare";

const WEATHER_EMOJI: Record<string, string> = {
  thriving: "✨", clear: "☀️", overcast: "⛅", rain: "🌧", storm: "⛈", destruction: "💥",
};

const CAT_COLORS: Record<string, string> = {
  needs: "bg-sky-400", wants: "bg-orange-400", treats: "bg-pink-400", investments: "bg-emerald-400",
};

function CompareBar({ label, mine, theirs, color }: { label: string; mine: number; theirs: number; color: string }) {
  const diff = mine - theirs;
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-xs text-slate-500">
          {diff > 0 ? <span className="text-sky-400">+{Math.round(diff)}%</span> :
           diff < 0 ? <span className="text-rose-400">{Math.round(diff)}%</span> :
           <span className="text-slate-500">Same</span>}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-slate-800 overflow-hidden">
        <div className={`absolute h-full rounded-full opacity-40 ${color}`} style={{ width: `${Math.round(theirs * 100)}%` }} />
        <div className={`absolute h-full rounded-full ${color}`} style={{ width: `${Math.round(mine * 100)}%` }} />
      </div>
      <div className="flex justify-between text-[10px] mt-0.5 text-slate-600">
        <span>Mine: {Math.round(mine * 100)}%</span>
        <span>Theirs: {Math.round(theirs * 100)}%</span>
      </div>
    </div>
  );
}

function SharedCityContent() {
  const params = useSearchParams();
  const code = params.get("c") ?? "";
  const { cityState: myCity, proportions: myProps, loadFromStorage } = useGameStore();
  const [fullscreen, setFullscreen] = useState(false);
  const [preset, setPreset] = useState<typeof CAMERA_PRESETS[number] | null>(null);

  useEffect(() => { loadFromStorage(); }, [loadFromStorage]);

  const shared = useMemo(() => decodeCityShare(code), [code]);

  if (!shared) {
    return (
      <main className="page-with-nav mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-4xl mb-4">⚠️</p>
        <h1 className="text-xl font-bold text-white">Invalid city link</h1>
        <p className="mt-2 text-sm text-slate-400">This share code is broken or expired.</p>
        <Link href="/city" className="mt-6 inline-block rounded-2xl bg-sky-500/20 border border-sky-500/30 px-5 py-2.5 text-sm font-semibold text-sky-300">
          View your city →
        </Link>
      </main>
    );
  }

  const override = { cityState: { ...shared.city, budgetUsed: 0 }, proportions: shared.props };

  const healthDiff = myCity.healthScore - shared.city.healthScore;

  return (
    <>
      <main className="page-with-nav mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <header className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">FinQuest · Shared City</p>
            <h1 className="mt-1 text-2xl font-bold text-white">{shared.name}</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFullscreen(true)}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              ⛶ Fullscreen
            </button>
            <Link href="/city" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
              My City →
            </Link>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
          {/* Left — canvas */}
          <div className="flex flex-col gap-4">
            {/* Camera preset strip */}
            <div className="flex gap-2 flex-wrap">
              {CAMERA_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setPreset(preset?.label === p.label ? null : p)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold border transition ${
                    preset?.label === p.label
                      ? "border-sky-400 bg-sky-500/20 text-sky-200"
                      : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  {p.icon} {p.label}
                </button>
              ))}
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl h-[46vh] min-h-[280px] sm:h-[480px]">
              <CityCanvas className="w-full h-full" preset={preset} override={override} />
            </div>

            {/* Their stats */}
            <div className="grid grid-cols-4 gap-2.5">
              {[
                { label: "Health", value: shared.city.healthScore },
                { label: "Weather", value: WEATHER_EMOJI[shared.city.weather] ?? shared.city.weather },
                { label: "Population", value: `${shared.city.population * 100}k` },
                { label: "Restaurants", value: String(shared.city.restaurantCount) },
              ].map(({ label, value }) => (
                <div key={label} className="glass-card rounded-2xl p-3 text-center">
                  <p className="text-[11px] text-slate-500">{label}</p>
                  <p className="mt-0.5 text-base font-bold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — comparison */}
          <div className="flex flex-col gap-4">
            {/* Head-to-head */}
            <div className="glass-card rounded-3xl p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Head to Head</p>
              <div className="flex items-center justify-between mb-4">
                <div className="text-center">
                  <p className="text-3xl font-black text-white">{myCity.healthScore}</p>
                  <p className="text-xs text-sky-400 font-semibold mt-0.5">Your score</p>
                </div>
                <div className="text-center px-4">
                  <p className={`text-lg font-bold ${healthDiff > 0 ? "text-emerald-400" : healthDiff < 0 ? "text-red-400" : "text-slate-400"}`}>
                    {healthDiff > 0 ? `+${healthDiff}` : healthDiff}
                  </p>
                  <p className="text-[10px] text-slate-500">difference</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-black text-slate-400">{shared.city.healthScore}</p>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Their score</p>
                </div>
              </div>

              <div className="h-px bg-white/8 mb-4" />

              {/* Spending comparison bars */}
              <div className="flex flex-col gap-3">
                <CompareBar label="🏠 Needs"   mine={myProps.needs}       theirs={shared.props.needs}       color={CAT_COLORS.needs} />
                <CompareBar label="🍕 Wants"   mine={myProps.wants}       theirs={shared.props.wants}       color={CAT_COLORS.wants} />
                <CompareBar label="🛍️ Treats"  mine={myProps.treats}      theirs={shared.props.treats}      color={CAT_COLORS.treats} />
                <CompareBar label="📈 Invest"  mine={myProps.investments} theirs={shared.props.investments} color={CAT_COLORS.investments} />
              </div>
              <p className="mt-3 text-[10px] text-slate-600 text-center">Solid bar = yours · Faded bar = theirs</p>
            </div>

            {/* Verdict */}
            <div className={`glass-card rounded-3xl p-4 border ${healthDiff >= 0 ? "border-emerald-500/20" : "border-rose-500/20"}`}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2 text-slate-400">Verdict</p>
              {healthDiff > 5 ? (
                <p className="text-sm text-emerald-300">Your city is healthier! Keep up the discipline.</p>
              ) : healthDiff < -5 ? (
                <p className="text-sm text-rose-300">Their city is doing better. Check their spending mix for inspiration.</p>
              ) : (
                <p className="text-sm text-slate-300">You&apos;re neck and neck — healthy competition!</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {fullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="absolute top-3 right-3 z-10">
            <button onClick={() => setFullscreen(false)} className="rounded-xl border border-white/20 bg-black/50 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/10 transition">
              ✕ Close
            </button>
          </div>
          <CityCanvas className="flex-1 w-full" preset={null} override={override} />
        </div>
      )}
    </>
  );
}

export default function SharedCityPage() {
  return (
    <Suspense fallback={
      <main className="page-with-nav flex items-center justify-center min-h-screen">
        <p className="text-slate-400 animate-pulse">Loading city…</p>
      </main>
    }>
      <SharedCityContent />
    </Suspense>
  );
}