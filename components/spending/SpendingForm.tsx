"use client";

import { useState } from "react";

import { useGameStore } from "@/store/useGameStore";
import type { TransactionCategory } from "@/types";

const CATEGORIES: { id: TransactionCategory; label: string; emoji: string; color: string; active: string }[] = [
  { id: "Need",   label: "Need",       emoji: "🏠", color: "border-white/10 bg-slate-900/70 text-slate-300", active: "border-sky-400   bg-sky-500/20   text-sky-100"     },
  { id: "Want",   label: "Want",       emoji: "🍕", color: "border-white/10 bg-slate-900/70 text-slate-300", active: "border-orange-400 bg-orange-500/20 text-orange-100" },
  { id: "Treat",  label: "Treat",      emoji: "🛍️", color: "border-white/10 bg-slate-900/70 text-slate-300", active: "border-pink-400   bg-pink-500/20   text-pink-100"   },
  { id: "Invest", label: "Invest",     emoji: "📈", color: "border-white/10 bg-slate-900/70 text-slate-300", active: "border-emerald-400 bg-emerald-500/20 text-emerald-100" },
];

interface SpendingFormProps {
  onSubmitted?: (proportions: ReturnType<typeof useGameStore.getState>["proportions"]) => void;
}

export function SpendingForm({ onSubmitted }: SpendingFormProps) {
  const addTransaction = useGameStore((s) => s.addTransaction);

  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<TransactionCategory>("Need");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  function simulatePayment() {
    const merchants = ["Woolworths", "Netflix", "Uber Eats", "CommBank", "H&M", "Spotify"];
    const amounts = [24, 15.99, 32, 10, 59, 11.99];
    const i = Math.floor(Math.random() * merchants.length);
    setMerchant(merchants[i]);
    setAmount(String(amounts[i]));
    setFeedback("Payment detected — tap a category to confirm.");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Number(amount);
    if (!parsed || parsed <= 0) return;

    setSubmitting(true);
    setFeedback(null);

    const newTransactions = addTransaction({ amount: parsed, category, merchant: merchant || undefined });
    const props = useGameStore.getState().proportions;
    await onSubmitted?.(props);

    setAmount("");
    setMerchant("");
    setFeedback(`✓ ${category} — city updated`);
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-[2rem] p-5 sm:p-6 flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">Log Transaction</p>
        <h2 className="mt-1 text-xl font-semibold text-white">One tap, city reacts</h2>
      </div>

      {/* Simulate Payment */}
      <button
        type="button"
        onClick={simulatePayment}
        className="rounded-xl border border-dashed border-sky-400/50 bg-sky-500/10 px-4 py-2.5 text-sm font-medium text-sky-200 transition hover:bg-sky-500/20"
      >
        ⚡ Simulate Payment
      </button>

      {/* Merchant */}
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-300">Merchant</span>
        <input
          type="text"
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          placeholder="e.g. Woolworths"
          className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-base text-white outline-none transition focus:border-sky-400"
        />
      </label>

      {/* Amount */}
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-300">Amount</span>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-base text-white outline-none transition focus:border-sky-400"
        />
      </label>

      {/* Category buttons */}
      <div>
        <span className="mb-2 block text-sm font-medium text-slate-300">Category</span>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`rounded-2xl border px-3 py-3.5 text-sm font-semibold transition ${
                category === cat.id ? cat.active : cat.color
              }`}
            >
              <span className="mr-1.5">{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!amount || Number(amount) <= 0 || submitting}
        className="w-full rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-400 px-4 py-3.5 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? "Updating city…" : `Log as ${category}`}
      </button>

      {feedback && (
        <p className="text-center text-sm text-slate-300">{feedback}</p>
      )}
    </form>
  );
}
