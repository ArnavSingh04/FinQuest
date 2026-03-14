"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";

import { useGameStore } from "@/store/useGameStore";
import { useUIStore } from "@/store/useUIStore";
import type { TransactionApiResponse, TransactionCategory } from "@/types";

const CAT_VARS: Record<TransactionCategory, string> = {
  Need: "var(--cat-need)",
  Want: "var(--cat-want)",
  Treat: "var(--cat-treat)",
  Invest: "var(--cat-invest)",
};

const CATEGORIES: {
  id: TransactionCategory;
  label: string;
  emoji: string;
  border: string;
  text: string;
}[] = [
  { id: "Need", label: "Need", emoji: "🏠", border: "border-cat-need", text: "text-cat-need" },
  { id: "Want", label: "Want", emoji: "✨", border: "border-cat-want", text: "text-cat-want" },
  { id: "Treat", label: "Treat", emoji: "🍕", border: "border-cat-treat", text: "text-cat-treat" },
  { id: "Invest", label: "Invest", emoji: "📈", border: "border-cat-invest", text: "text-cat-invest" },
];

const SUBMIT_LABELS: Record<TransactionCategory, string> = {
  Need: "Log as Need",
  Want: "Log as Want",
  Treat: "Log as Treat",
  Invest: "Log as Invest",
};

export function LogSheetContent() {
  const setActiveSheet = useUIStore((s) => s.setActiveSheet);
  const triggerCityPulse = useUIStore((s) => s.triggerCityPulse);
  const addTransaction = useGameStore((s) => s.addTransaction);

  const [amount, setAmount] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [category, setCategory] = useState<TransactionCategory>("Need");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const amountNum = useMemo(() => (amount === "" ? 0 : Number(amount)), [amount]);
  const isValid = amountNum > 0 && !isSubmitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          category,
          merchant_name: merchantName || null,
          note: note || null,
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Unable to save transaction.");
      }
      const payload = (await res.json()) as TransactionApiResponse;
      localStorage.setItem("finquest-ratios", JSON.stringify(payload.ratios));
      localStorage.setItem("finquest-city-metrics", JSON.stringify(payload.cityMetrics));
      localStorage.setItem("finquest-progress", JSON.stringify(payload.progress));
      const last = payload.transactions?.[payload.transactions.length - 1];
      if (last) {
        addTransaction({
          amount: last.amount,
          category: last.category,
          merchant_name: last.merchant_name ?? null,
        });
      }
      setActiveSheet(null);
      triggerCityPulse();
    } catch {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 pb-6">
      <h2 className="font-heading text-2xl font-normal text-text-primary" style={{ fontSize: 24 }}>
        New Transaction
      </h2>

      {/* Amount — large, centred, $ prefix */}
      <div className="mt-6 flex flex-col items-center">
        <div className="flex items-baseline justify-center gap-0.5">
          <span className="font-heading text-4xl text-text-primary" style={{ fontSize: 48 }}>
            $
          </span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={0.01}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-32 border-none bg-transparent font-heading text-text-primary outline-none [font-size:48px] placeholder:text-text-muted"
            aria-label="Amount"
          />
        </div>
        <input
          type="text"
          value={merchantName}
          onChange={(e) => setMerchantName(e.target.value)}
          placeholder="Merchant name"
          className="mt-2 w-full max-w-xs border-none bg-transparent text-center text-sm text-text-muted outline-none placeholder:text-text-muted"
          aria-label="Merchant"
        />
      </div>

      {/* Category selector — 2x2 pills */}
      <div className="mt-8 grid grid-cols-2 gap-3">
        {CATEGORIES.map((cat) => {
          const selected = category === cat.id;
          return (
            <motion.button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`touch-target flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3 text-sm font-semibold transition active:scale-[0.97] ${
                selected
                  ? `border-transparent text-white shadow-card`
                  : `border-current bg-bg-elevated ${cat.border} ${cat.text}`
              }`}
              style={selected ? { backgroundColor: CAT_VARS[cat.id] } : undefined}
              whileTap={selected ? { scale: 1.03 } : undefined}
              animate={selected ? { scale: 1.03 } : { scale: 1 }}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Note */}
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note..."
        className="mt-6 w-full border-none border-b border-border bg-transparent py-2 text-sm text-text-secondary outline-none placeholder:text-text-muted"
      />

      {/* Submit — full width, 56px, rounded-full, label/color by category */}
      <button
        type="submit"
        disabled={!isValid}
        className="touch-target mt-8 h-14 min-h-[44px] w-full rounded-full text-base font-semibold text-white transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          backgroundColor: isValid
            ? (category === "Need"
                ? "var(--cat-need)"
                : category === "Want"
                  ? "var(--cat-want)"
                  : category === "Treat"
                    ? "var(--cat-treat)"
                    : "var(--cat-invest)")
            : "var(--text-muted)",
        }}
      >
        {isSubmitting ? "Saving…" : SUBMIT_LABELS[category]}
      </button>
    </form>
  );
}
