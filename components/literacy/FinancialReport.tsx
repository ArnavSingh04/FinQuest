"use client";

import { useMemo } from "react";
import { useGameStore } from "@/store/useGameStore";

// ─── 50/30/20 Rule ────────────────────────────────────────────────────────────
// Classic personal finance guideline:
//   Needs  ≤ 50%   (housing, food, utilities)
//   Wants  ≤ 30%   (entertainment, dining out)
//   Invest ≥ 20%   (savings, investments)  — Treats should be folded into Wants

const RULES = [
  {
    id: "needs",
    label: "Needs",
    icon: "🏠",
    target: 50,
    mode: "max" as const,
    tip: "Aim to keep essentials (rent, food, bills) under 50% of income.",
    color: { bar: "bg-sky-400", text: "text-sky-300", bg: "bg-sky-500/15 border-sky-500/25" },
  },
  {
    id: "wants",
    label: "Wants + Treats",
    icon: "🍕",
    target: 30,
    mode: "max" as const,
    tip: "Keep lifestyle & impulse spending under 30%. Treats count here too.",
    color: { bar: "bg-orange-400", text: "text-orange-300", bg: "bg-orange-500/15 border-orange-500/25" },
  },
  {
    id: "invest",
    label: "Investments",
    icon: "📈",
    target: 20,
    mode: "min" as const,
    tip: "Try to invest or save at least 20% — even $1 invested today compounds.",
    color: { bar: "bg-emerald-400", text: "text-emerald-300", bg: "bg-emerald-500/15 border-emerald-500/25" },
  },
];

// ─── Badges ───────────────────────────────────────────────────────────────────
const BADGES = [
  { id: "first_tx",     icon: "🏙️", label: "City Founder",     desc: "Logged your first transaction",          check: (txs: number) => txs >= 1 },
  { id: "first_invest", icon: "📈", label: "First Investment",  desc: "Made your first investment",             check: (_: number, invest: number) => invest > 0 },
  { id: "saver",        icon: "💰", label: "Disciplined Saver", desc: "Investments ≥ 20% of spending",          check: (_: number, invest: number) => invest >= 0.2 },
  { id: "balanced",     icon: "⚖️", label: "Balanced Budget",   desc: "All 4 categories used",                 check: (txs: number, inv: number, wants: number, needs: number, treats: number) => inv > 0 && wants > 0 && needs > 0 && treats > 0 },
  { id: "thriving",     icon: "✨", label: "City Thriving",     desc: "Achieved health score ≥ 88",             check: (_: number, __: number, ___: number, ____: number, _____: number, health: number) => health >= 88 },
  { id: "no_treats",    icon: "🚫", label: "Clean Streak",      desc: "Treats under 5% of spending",            check: (_: number, __: number, ___: number, ____: number, treats: number) => treats > 0 && treats < 0.05 },
  { id: "big_invest",   icon: "🏦", label: "Tycoon",            desc: "Investments ≥ 35% of spending",          check: (_: number, invest: number) => invest >= 0.35 },
];

// ─── Financial Tips carousel ─────────────────────────────────────────────────
const TIPS = [
  { title: "The 50/30/20 Rule", body: "Split income: 50% needs, 30% wants, 20% savings. It's the simplest budget framework ever invented." },
  { title: "Pay Yourself First", body: "Move your savings contribution the day you get paid — before you can spend it. Automate it if possible." },
  { title: "Compound Interest", body: "$100/month at 7% annual return becomes $120,000 in 30 years. Time in market beats timing the market." },
  { title: "Emergency Fund", body: "Keep 3–6 months of expenses in a liquid account. It stops small crises becoming financial disasters." },
  { title: "Impulse Buying", body: "Wait 48 hours before any unplanned purchase over $50. Most impulses evaporate. Your wallet will thank you." },
  { title: "Needs vs Wants", body: "A 'need' keeps you alive and employable. Everything else is a want. Honest categorisation is the hardest skill in finance." },
  { title: "Lifestyle Creep", body: "When income rises, spending tends to rise with it. The wealthy keep their cost of living flat and invest the difference." },
];

interface RuleBarProps {
  label: string;
  icon: string;
  pct: number;
  target: number;
  mode: "max" | "min";
  tip: string;
  color: { bar: string; text: string; bg: string };
}

function RuleBar({ label, icon, pct, target, mode, tip, color }: RuleBarProps) {
  const pass = mode === "max" ? pct <= target : pct >= target;
  const barW = Math.min(100, pct);
  const targetW = (target / 100) * 100;

  return (
    <div className={`rounded-2xl border p-3.5 ${color.bg}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{icon}</span>
        <span className={`text-xs font-semibold ${color.text}`}>{label}</span>
        <span className={`ml-auto text-xs font-bold ${pass ? "text-emerald-400" : "text-red-400"}`}>
          {pass ? "✓ Pass" : "✗ Over"}
        </span>
      </div>
      <div className="relative h-2.5 w-full rounded-full bg-slate-800 overflow-hidden mb-1.5">
        <div className={`h-full rounded-full transition-all duration-700 ${color.bar}`} style={{ width: `${barW}%` }} />
        {/* Target marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/40"
          style={{ left: `${targetW}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-500">
        <span>{Math.round(pct)}% actual</span>
        <span>{mode === "max" ? "≤" : "≥"} {target}% target</span>
      </div>
      {!pass && <p className="mt-1.5 text-[11px] text-slate-400">{tip}</p>}
    </div>
  );
}

export function FinancialReport() {
  const { proportions, transactions, cityState } = useGameStore();
  const tipIdx = useMemo(() => Math.floor(Date.now() / 1000 / 3600) % TIPS.length, []);
  const tip = TIPS[tipIdx];

  const wantsPlusTreats = proportions.wants + proportions.treats;

  const earnedBadges = BADGES.filter((b) =>
    b.check(
      transactions.length,
      proportions.investments,
      proportions.wants,
      proportions.needs,
      proportions.treats,
      cityState.healthScore,
    )
  );

  if (transactions.length === 0) {
    return (
      <div className="glass-card rounded-3xl p-5 text-center">
        <p className="text-2xl mb-2">📊</p>
        <p className="text-sm font-semibold text-white">Financial Report</p>
        <p className="mt-1 text-xs text-slate-400">Log transactions to unlock your 50/30/20 breakdown and badges.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 50/30/20 Section */}
      <div className="glass-card rounded-3xl p-5">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">50 / 30 / 20 Rule</p>
        <p className="mb-4 text-[11px] text-slate-500">Classic guide: 50% needs · 30% wants · 20% invest</p>
        <div className="flex flex-col gap-3">
          <RuleBar {...RULES[0]} pct={proportions.needs * 100}      />
          <RuleBar {...RULES[1]} pct={wantsPlusTreats * 100}        />
          <RuleBar {...RULES[2]} pct={proportions.investments * 100} />
        </div>
      </div>

      {/* Badges */}
      <div className="glass-card rounded-3xl p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Achievements · {earnedBadges.length}/{BADGES.length}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {BADGES.map((b) => {
            const earned = earnedBadges.some((e) => e.id === b.id);
            return (
              <div
                key={b.id}
                className={`rounded-2xl border p-3 transition ${
                  earned
                    ? "border-yellow-500/40 bg-yellow-500/10"
                    : "border-white/5 bg-white/3 opacity-40"
                }`}
              >
                <span className={`text-xl ${earned ? "" : "grayscale"}`}>{b.icon}</span>
                <p className={`mt-1 text-xs font-semibold ${earned ? "text-white" : "text-slate-500"}`}>{b.label}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Tip */}
      <div className="glass-card rounded-3xl p-5 border border-emerald-500/15">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">💡</span>
          <span className="text-xs font-semibold uppercase tracking-widest text-emerald-300">Financial Tip</span>
        </div>
        <p className="text-sm font-semibold text-white mb-1">{tip.title}</p>
        <p className="text-xs leading-5 text-slate-400">{tip.body}</p>
      </div>
    </div>
  );
}
