"use client";

import { useEffect, useState } from "react";

import { useGameStore } from "@/store/useGameStore";
import type { TransactionCategory } from "@/types";

const CATEGORY_STYLE: Record<TransactionCategory, { icon: string; color: string; bg: string }> = {
  Need:   { icon: "🏠", color: "text-sky-300",     bg: "bg-sky-500/15 border-sky-500/25" },
  Want:   { icon: "🍕", color: "text-orange-300",  bg: "bg-orange-500/15 border-orange-500/25" },
  Treat:  { icon: "🛍️", color: "text-pink-300",    bg: "bg-pink-500/15 border-pink-500/25" },
  Invest: { icon: "📈", color: "text-emerald-300", bg: "bg-emerald-500/15 border-emerald-500/25" },
};

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("en-AU", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function CategoryBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => { const t = setTimeout(() => setWidth(pct), 80); return () => clearTimeout(t); }, [pct]);
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 text-xs text-slate-400 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className={`w-10 text-right text-xs font-semibold ${color.replace("bg-", "text-")}`}>
        {Math.round(pct)}%
      </span>
    </div>
  );
}

export default function HistoryPage() {
  const { transactions, proportions, cityState, clearAll, loadFromStorage } = useGameStore();
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => { loadFromStorage(); }, [loadFromStorage]);

  const sorted = [...transactions].reverse();
  const totalSpend = transactions.reduce((s, t) => s + t.amount, 0);

  function handleReset() {
    if (!confirmReset) { setConfirmReset(true); return; }
    clearAll();
    setConfirmReset(false);
  }

  return (
    <main className="page-with-nav mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">FinQuest</p>
        <h1 className="mt-1 text-2xl font-bold text-white">Transaction History</h1>
        <p className="mt-1 text-sm text-slate-400">
          {transactions.length} transaction{transactions.length !== 1 ? "s" : ""} · ${totalSpend.toFixed(2)} tracked
        </p>
      </header>

      {/* Breakdown bars */}
      {transactions.length > 0 && (
        <section className="glass-card mb-5 rounded-3xl p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">Spending Breakdown</p>
          <div className="flex flex-col gap-3">
            <CategoryBar label="Needs"  pct={proportions.needs * 100}       color="bg-sky-400" />
            <CategoryBar label="Wants"  pct={proportions.wants * 100}       color="bg-orange-400" />
            <CategoryBar label="Treats" pct={proportions.treats * 100}      color="bg-pink-400" />
            <CategoryBar label="Invest" pct={proportions.investments * 100} color="bg-emerald-400" />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/8 pt-4">
            <div className="text-center">
              <p className="text-xs text-slate-500">Health Score</p>
              <p className="mt-0.5 text-xl font-bold text-white">{cityState.healthScore}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500">Weather</p>
              <p className="mt-0.5 text-xl font-bold capitalize text-white">{cityState.weather}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500">Population</p>
              <p className="mt-0.5 text-xl font-bold text-white">{cityState.population * 100}k</p>
            </div>
          </div>
        </section>
      )}

      {/* Transaction list */}
      <section className="flex flex-col gap-2">
        {sorted.length === 0 ? (
          <div className="glass-card rounded-3xl p-10 text-center">
            <p className="text-4xl">🏙️</p>
            <p className="mt-4 font-semibold text-white">No transactions yet</p>
            <p className="mt-1.5 text-sm text-slate-400">Log a purchase to start building your city.</p>
          </div>
        ) : (
          sorted.map((tx, i) => {
            const style = CATEGORY_STYLE[tx.category];
            return (
              <div key={tx.id ?? i} className={`glass-card-sm flex items-center gap-4 rounded-2xl border p-4 ${style.bg}`}>
                <span className="text-2xl">{style.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-white">{tx.merchant || tx.category}</p>
                  <p className="text-xs text-slate-500">{formatDate(tx.created_at)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-bold ${style.color}`}>${tx.amount.toFixed(2)}</p>
                  <p className="text-xs text-slate-500">{tx.category}</p>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Reset */}
      {transactions.length > 0 && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleReset}
            className={`rounded-2xl border px-6 py-2.5 text-sm font-semibold transition ${
              confirmReset
                ? "border-red-500 bg-red-500/20 text-red-300 hover:bg-red-500/30"
                : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"
            }`}
          >
            {confirmReset ? "⚠️ Tap again to confirm reset" : "Reset all data"}
          </button>
        </div>
      )}
    </main>
  );
}
