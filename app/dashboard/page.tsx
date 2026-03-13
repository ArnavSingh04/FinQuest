"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { BudgetCard } from "@/components/budget/BudgetCard";
import { SpendingForm } from "@/components/spending/SpendingForm";
import { useGameStore } from "@/store/useGameStore";
import { getCityTier, getStreak } from "@/lib/cityLevel";
import type { Proportions, TransactionCategory } from "@/types";

// ── Category bar ──────────────────────────────────────────────────────────────
const BAR_COLORS: Record<string, string> = {
  needs: "bg-gradient-to-r from-sky-500 to-sky-400",
  wants: "bg-gradient-to-r from-orange-500 to-amber-400",
  treats: "bg-gradient-to-r from-pink-500 to-rose-400",
  investments: "bg-gradient-to-r from-emerald-500 to-teal-400",
};
const BAR_TEXT: Record<string, string> = {
  needs: "text-sky-300", wants: "text-orange-300", treats: "text-pink-300", investments: "text-emerald-300",
};

function CategoryBar({ id, label, pct }: { id: string; label: string; pct: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => { const t = setTimeout(() => setWidth(pct), 100); return () => clearTimeout(t); }, [pct]);
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-xs font-medium text-slate-300">{label}</span>
        <span className={`text-xs font-bold ${BAR_TEXT[id]}`}>{Math.round(pct)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-800/80 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${BAR_COLORS[id]}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

// ── Health ring ───────────────────────────────────────────────────────────────
function HealthRing({ score }: { score: number }) {
  const transactions = useGameStore((s) => s.transactions);
  const tier = getCityTier(score);
  const streak = getStreak(transactions);

  const barColor =
    score >= 88 ? "bg-emerald-400" :
    score >= 70 ? "bg-sky-400" :
    score >= 50 ? "bg-amber-400" :
    score >= 30 ? "bg-orange-500" : "bg-red-500";

  const weatherLabel =
    score >= 88 ? "✨ Thriving" :
    score >= 70 ? "☀️ Clear" :
    score >= 50 ? "⛅ Stable" :
    score >= 30 ? "🌧 At risk" :
    score >= 15 ? "⛈ Storm" : "💥 Critical";

  return (
    <div className="glass-card rounded-3xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">City Health</span>
        <span className="text-xs font-semibold text-slate-400">{weatherLabel}</span>
      </div>
      <div className="flex items-end gap-3 mb-3">
        <span className={`text-5xl font-black ${tier.color}`}>{score}</span>
        <span className="text-slate-500 text-sm pb-1">/ 100</span>
        <div className="ml-auto flex flex-col items-end gap-1">
          <span className={`text-xs font-bold ${tier.color}`}>{tier.icon} {tier.name}</span>
          {streak > 0 && <span className="text-xs text-amber-400">🔥 {streak}d streak</span>}
        </div>
      </div>
      <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="mt-2 text-[11px] text-slate-500">{tier.desc}</p>
    </div>
  );
}

// ── Advisor panel ─────────────────────────────────────────────────────────────
function AdvisorPanel({ message, loading }: { message: string; loading: boolean }) {
  return (
    <div className="glass-card rounded-3xl p-5 border border-sky-500/15">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-sky-400 to-emerald-400 flex items-center justify-center text-xs font-bold text-slate-950">
          AI
        </div>
        <span className="text-xs font-semibold uppercase tracking-widest text-sky-300">Advisor</span>
        {loading && (
          <span className="ml-auto text-xs text-slate-500 animate-pulse">thinking…</span>
        )}
      </div>
      <p className="text-sm leading-7 text-slate-300">
        {loading ? (
          <span className="animate-pulse">Analysing your spending pattern…</span>
        ) : (
          message
        )}
      </p>
    </div>
  );
}

// ── Recent transactions (last 5) ──────────────────────────────────────────────
const CAT_ICONS: Record<TransactionCategory, string> = {
  Need: "🏠", Want: "🍕", Treat: "🛍️", Invest: "📈",
};
const CAT_COLOR: Record<TransactionCategory, string> = {
  Need: "text-sky-300", Want: "text-orange-300", Treat: "text-pink-300", Invest: "text-emerald-300",
};

function RecentTransactions() {
  const transactions = useGameStore((s) => s.transactions);
  const recent = [...transactions].reverse().slice(0, 5);

  if (!recent.length) return null;

  return (
    <div className="glass-card rounded-3xl p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Recent</span>
        <Link href="/history" className="text-xs text-sky-400 hover:text-sky-300 transition">
          View all →
        </Link>
      </div>
      <div className="flex flex-col gap-2">
        {recent.map((tx, i) => (
          <div key={tx.id ?? i} className="flex items-center gap-3">
            <span className="text-lg">{CAT_ICONS[tx.category]}</span>
            <span className="flex-1 truncate text-sm text-slate-300">{tx.merchant || tx.category}</span>
            <span className={`text-sm font-semibold shrink-0 ${CAT_COLOR[tx.category]}`}>
              ${tx.amount.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
async function fetchAdvisor(proportions: Proportions): Promise<string> {
  const res = await fetch("/api/insight", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(proportions),
  });
  if (!res.ok) throw new Error("unavailable");
  const d = (await res.json()) as { insight: string };
  return d.insight;
}

export default function DashboardPage() {
  const { proportions, cityState, advisorMessage, isAdvisorLoading, loadFromStorage, setAdvisorMessage, setAdvisorLoading } =
    useGameStore();

  useEffect(() => { loadFromStorage(); }, [loadFromStorage]);

  async function handleSubmitted(p: Proportions) {
    setAdvisorLoading(true);
    try {
      setAdvisorMessage(await fetchAdvisor(p));
    } catch { /* fallback stays */ }
    finally { setAdvisorLoading(false); }
  }

  return (
    <main className="page-with-nav mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">FinQuest</p>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Dashboard</h1>
        </div>
        <Link href="/city" className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
          Open City ⬡
        </Link>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        {/* Left */}
        <div className="flex flex-col gap-5">
          <SpendingForm onSubmitted={handleSubmitted} />
          <BudgetCard />
          <RecentTransactions />
        </div>

        {/* Right */}
        <div className="flex flex-col gap-5">
          <HealthRing score={cityState.healthScore} />

          {/* Breakdown bars */}
          <div className="glass-card rounded-3xl p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">Spending Mix</p>
            <div className="flex flex-col gap-4">
              <CategoryBar id="needs"       label="🏠 Needs"   pct={proportions.needs * 100} />
              <CategoryBar id="wants"       label="🍕 Wants"   pct={proportions.wants * 100} />
              <CategoryBar id="treats"      label="🛍️ Treats"  pct={proportions.treats * 100} />
              <CategoryBar id="investments" label="📈 Invest"  pct={proportions.investments * 100} />
            </div>
          </div>

          {/* City snapshot */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Weather",     value: cityState.weather,           className: "capitalize" },
              { label: "Population",  value: `${cityState.population * 100}k` },
              { label: "Restaurants", value: String(cityState.restaurantCount) },
            ].map(({ label, value, className }) => (
              <div key={label} className="glass-card-sm rounded-2xl border border-white/8 p-3.5 text-center">
                <p className="text-xs text-slate-500">{label}</p>
                <p className={`mt-1 font-bold text-white ${className ?? ""}`}>{value}</p>
              </div>
            ))}
          </div>

          <AdvisorPanel message={advisorMessage} loading={isAdvisorLoading} />

          {/* Quick link to Financial Report */}
          <Link
            href="/learn"
            className="glass-card rounded-3xl p-4 flex items-center gap-3 border border-emerald-500/15 hover:border-emerald-500/30 transition group"
          >
            <span className="text-2xl">📊</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Financial Report</p>
              <p className="text-xs text-slate-400">50/30/20 rule · badges · tips</p>
            </div>
            <span className="text-slate-500 group-hover:text-white transition text-sm">→</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
