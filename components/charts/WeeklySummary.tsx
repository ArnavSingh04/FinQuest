"use client";

import { useMemo } from "react";
import { useGameStore } from "@/store/useGameStore";
import type { TransactionCategory } from "@/types";

const CATS: { id: TransactionCategory; label: string; icon: string; color: string }[] = [
  { id: "Need",   label: "Needs",   icon: "🏠", color: "text-sky-300"     },
  { id: "Want",   label: "Wants",   icon: "🍕", color: "text-orange-300"  },
  { id: "Treat",  label: "Treats",  icon: "🛍️", color: "text-pink-300"    },
  { id: "Invest", label: "Invest",  icon: "📈", color: "text-emerald-300" },
];

function weekBounds(weeksAgo: number) {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - day);
  startOfThisWeek.setHours(0, 0, 0, 0);

  const start = new Date(startOfThisWeek);
  start.setDate(start.getDate() - weeksAgo * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

export function WeeklySummary() {
  const { transactions, monthlyIncome } = useGameStore();

  const { thisWeek, lastWeek } = useMemo(() => {
    const tw = weekBounds(0);
    const lw = weekBounds(1);

    const filterWeek = (s: Date, e: Date) =>
      transactions.filter((t) => {
        const d = new Date(t.created_at ?? 0);
        return d >= s && d < e;
      });

    const sum = (txs: typeof transactions, cat?: TransactionCategory) =>
      txs.filter((t) => !cat || t.category === cat).reduce((s, t) => s + t.amount, 0);

    const twTxs = filterWeek(tw.start, tw.end);
    const lwTxs = filterWeek(lw.start, lw.end);

    return {
      thisWeek: {
        total: sum(twTxs),
        bycat: Object.fromEntries(CATS.map((c) => [c.id, sum(twTxs, c.id)])) as Record<TransactionCategory, number>,
        count: twTxs.length,
      },
      lastWeek: {
        total: sum(lwTxs),
        bycat: Object.fromEntries(CATS.map((c) => [c.id, sum(lwTxs, c.id)])) as Record<TransactionCategory, number>,
      },
    };
  }, [transactions]);

  if (thisWeek.count === 0 && lastWeek.total === 0) return null;

  const delta = thisWeek.total - lastWeek.total;
  const weeklyBudget = monthlyIncome > 0 ? monthlyIncome / 4.33 : 0;
  const budgetPct = weeklyBudget > 0 ? Math.min(100, (thisWeek.total / weeklyBudget) * 100) : 0;

  return (
    <div className="glass-card rounded-3xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">This Week</span>
        {lastWeek.total > 0 && (
          <span className={`text-xs font-bold ${delta > 0 ? "text-red-400" : delta < 0 ? "text-emerald-400" : "text-slate-500"}`}>
            {delta > 0 ? `↑ $${delta.toFixed(0)} more` : delta < 0 ? `↓ $${Math.abs(delta).toFixed(0)} less` : "same as last week"}
          </span>
        )}
      </div>

      <div className="flex items-end gap-2 mb-3">
        <span className="text-3xl font-black text-white">${thisWeek.total.toFixed(0)}</span>
        {weeklyBudget > 0 && (
          <span className="text-slate-500 text-xs pb-0.5">of ${weeklyBudget.toFixed(0)} weekly</span>
        )}
      </div>

      {weeklyBudget > 0 && (
        <div className="h-1.5 w-full rounded-full bg-slate-800 mb-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${budgetPct > 100 ? "bg-red-500" : budgetPct > 80 ? "bg-amber-400" : "bg-emerald-400"}`}
            style={{ width: `${Math.min(100, budgetPct)}%` }}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {CATS.map(({ id, label, icon, color }) => {
          const amount = thisWeek.bycat[id];
          const prev = lastWeek.bycat[id];
          const diff = amount - prev;
          if (amount === 0 && prev === 0) return null;
          return (
            <div key={id} className="flex items-center gap-2">
              <span className="text-sm">{icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-slate-500">{label}</p>
                <p className={`text-xs font-bold ${color}`}>${amount.toFixed(0)}</p>
              </div>
              {prev > 0 && (
                <span className={`text-[10px] shrink-0 ${diff > 0 ? "text-red-400" : diff < 0 ? "text-emerald-400" : "text-slate-500"}`}>
                  {diff > 0 ? `+${diff.toFixed(0)}` : diff.toFixed(0)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
