"use client";

import { useState } from "react";
import { useGameStore } from "@/store/useGameStore";

export function BudgetCard() {
  const { monthlyIncome, setMonthlyIncome, transactions } = useGameStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const totalSpend = transactions.reduce((s, t) => s + t.amount, 0);
  const budgetUsed = monthlyIncome > 0 ? totalSpend / monthlyIncome : null;
  const pct = budgetUsed !== null ? Math.min(100, budgetUsed * 100) : 0;

  const barColor =
    budgetUsed === null ? "bg-slate-600" :
    budgetUsed > 1   ? "bg-red-500" :
    budgetUsed > 0.8 ? "bg-amber-400" :
    "bg-emerald-400";

  const statusText =
    budgetUsed === null ? null :
    budgetUsed > 1   ? `⚠️ Over budget by $${(totalSpend - monthlyIncome).toFixed(0)}` :
    budgetUsed > 0.8 ? "🔶 Approaching budget limit" :
    "✅ Within budget";

  function save() {
    const v = parseFloat(draft);
    if (v > 0) { setMonthlyIncome(v); }
    setEditing(false);
    setDraft("");
  }

  return (
    <div className="glass-card rounded-3xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Monthly Budget</span>
        <button
          onClick={() => { setEditing(true); setDraft(monthlyIncome > 0 ? String(monthlyIncome) : ""); }}
          className="text-xs text-sky-400 hover:text-sky-300 transition"
        >
          {monthlyIncome > 0 ? "Edit" : "Set income"}
        </button>
      </div>

      {editing ? (
        <div className="flex gap-2 mt-1">
          <input
            autoFocus
            type="number"
            inputMode="decimal"
            min="1"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="Monthly income ($)"
            className="flex-1 rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-white outline-none focus:border-sky-400"
          />
          <button
            onClick={save}
            className="rounded-xl bg-sky-500/20 border border-sky-500/30 px-3 py-2 text-sm font-semibold text-sky-300 hover:bg-sky-500/30 transition"
          >
            Save
          </button>
          <button
            onClick={() => setEditing(false)}
            className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>
      ) : monthlyIncome === 0 ? (
        <p className="text-sm text-slate-500">
          Set your monthly income to track budget usage and improve your city&apos;s health score.
        </p>
      ) : (
        <>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-3xl font-black text-white">${totalSpend.toFixed(0)}</span>
            <span className="text-slate-500 pb-0.5 text-sm">of ${monthlyIncome.toLocaleString()}</span>
            <span className={`ml-auto text-sm font-bold pb-0.5 ${
              budgetUsed! > 1 ? "text-red-400" : budgetUsed! > 0.8 ? "text-amber-400" : "text-emerald-400"
            }`}>
              {Math.round(pct)}%
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {statusText && (
            <p className="mt-2 text-xs text-slate-400">{statusText}</p>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
            <div>
              <span className="text-slate-400 font-medium">Remaining</span>
              <p className={`font-bold text-sm ${monthlyIncome - totalSpend < 0 ? "text-red-400" : "text-white"}`}>
                ${(monthlyIncome - totalSpend).toFixed(0)}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Transactions</span>
              <p className="font-bold text-sm text-white">{transactions.length}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
