"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import { useGameStore } from "@/store/useGameStore";
import { useUIStore } from "@/store/useUIStore";
import type { TransactionCategory } from "@/types";

const CATEGORY_COLORS: Record<TransactionCategory, string> = {
  Need: "#3B7DD8",
  Want: "#E8A020",
  Treat: "#D94F3D",
  Invest: "#3DAB6A",
};

const CATEGORY_TILES: {
  id: TransactionCategory;
  emoji: string;
  title: string;
  subtitle: string;
}[] = [
  { id: "Need", emoji: "🏠", title: "Need", subtitle: "Rent, groceries, utilities" },
  { id: "Want", emoji: "🍕", title: "Want", subtitle: "Dining out, entertainment" },
  { id: "Treat", emoji: "✨", title: "Treat", subtitle: "Luxury, impulse buys" },
  { id: "Invest", emoji: "📈", title: "Investment", subtitle: "Savings, stocks, education" },
];

const AMOUNT_RANGES: { id: string; title: string; subtitle: string; midpoint: number }[] = [
  { id: "<10", title: "<$10", subtitle: "Less than $10", midpoint: 5 },
  { id: "10-20", title: "$10–$20", subtitle: "Between $10 and $20", midpoint: 15 },
  { id: "20-50", title: "$20–$50", subtitle: "Between $20 and $50", midpoint: 35 },
  { id: "50-100", title: "$50–$100", subtitle: "Between $50 and $100", midpoint: 75 },
  { id: "100-200", title: "$100–$200", subtitle: "Between $100 and $200", midpoint: 150 },
  { id: "200+", title: ">$200", subtitle: "More than $200", midpoint: 250 },
];

export function LogSheetContent() {
  const setActiveSheet = useUIStore((s) => s.setActiveSheet);
  const triggerCityPulse = useUIStore((s) => s.triggerCityPulse);
  const addTransaction = useGameStore((s) => s.addTransaction);

  const [category, setCategory] = useState<TransactionCategory | null>(null);
  const [amountRange, setAmountRange] = useState<(typeof AMOUNT_RANGES)[number] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = category != null && amountRange != null && !isSubmitting;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !category || !amountRange) return;
    setIsSubmitting(true);
    addTransaction({
      amount: amountRange.midpoint,
      category,
      merchant_name: category,
      note: amountRange.title,
    });
    setActiveSheet(null);
    triggerCityPulse();
    setIsSubmitting(false);
  }

  return (
    <div className="px-4 pb-6">
      {/* Header */}
      <button
        type="button"
        onClick={() => setActiveSheet(null)}
        className="mb-4 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
        style={{ fontFamily: "var(--font-sans), sans-serif" }}
      >
        ← Back to city
      </button>
      <h2
        className="text-2xl font-normal text-[var(--text-primary)]"
        style={{ fontFamily: "var(--font-serif), serif" }}
      >
        Log a Transaction
      </h2>
      <p
        className="mt-1 text-sm text-[var(--text-muted)]"
        style={{ fontFamily: "var(--font-sans), sans-serif" }}
      >
        Choose what you spent on and roughly how big the purchase was.
      </p>

      <form onSubmit={handleSubmit} className="mt-6">
        {/* Step 1 — Type of spend */}
        <p
          className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]"
          style={{ fontFamily: "var(--font-sans), sans-serif" }}
        >
          Type of spend
        </p>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORY_TILES.map((cat) => {
            const selected = category === cat.id;
            const color = CATEGORY_COLORS[cat.id];
            return (
              <motion.button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className="touch-target flex min-h-[44px] flex-col items-start justify-center rounded-2xl border-2 px-4 py-3 text-left transition active:scale-[0.97]"
                style={{
                  borderRadius: 16,
                  backgroundColor: selected ? `${color}18` : "var(--bg-surface)",
                  borderColor: selected ? color : "var(--border)",
                }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="text-lg leading-tight">
                  {cat.emoji} <span className="font-semibold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-sans), sans-serif" }}>{cat.title}</span>
                </span>
                <span className="mt-0.5 text-xs text-[var(--text-muted)]" style={{ fontFamily: "var(--font-sans), sans-serif" }}>
                  {cat.subtitle}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Step 2 — How big was it? */}
        <p
          className="mt-6 mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]"
          style={{ fontFamily: "var(--font-sans), sans-serif" }}
        >
          How big was it?
        </p>
        <div className="grid grid-cols-2 gap-3">
          {AMOUNT_RANGES.map((range) => {
            const selected = amountRange?.id === range.id;
            const color = category ? CATEGORY_COLORS[category] : "var(--border)";
            return (
              <motion.button
                key={range.id}
                type="button"
                onClick={() => setAmountRange(range)}
                className="touch-target flex min-h-[44px] flex-col items-start justify-center rounded-2xl border-2 px-4 py-3 text-left transition active:scale-[0.97]"
                style={{
                  borderRadius: 16,
                  backgroundColor: selected && category ? `${CATEGORY_COLORS[category]}18` : "var(--bg-surface)",
                  borderColor: selected && category ? CATEGORY_COLORS[category] : "var(--border)",
                }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="font-semibold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-sans), sans-serif" }}>
                  {range.title}
                </span>
                <span className="mt-0.5 text-xs text-[var(--text-muted)]" style={{ fontFamily: "var(--font-sans), sans-serif" }}>
                  {range.subtitle}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="touch-target mt-8 h-14 w-full rounded-full text-base font-semibold text-white transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            backgroundColor: canSubmit && category ? CATEGORY_COLORS[category] : "var(--text-muted)",
          }}
        >
          {isSubmitting ? "Saving…" : "Log Transaction →"}
        </button>
      </form>
    </div>
  );
}
