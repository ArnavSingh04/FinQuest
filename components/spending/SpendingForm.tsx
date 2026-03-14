"use client";

import { useState } from "react";
import { useCityStore } from "@/store/useCityStore";
import type { TransactionApiResponse, TransactionCategory } from "@/types";

interface CategoryConfig {
  label: TransactionCategory;
  icon: string;
  description: string;
  cityEffect: string;
  color: string;
  borderActive: string;
  bgActive: string;
  textActive: string;
  tip: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    label: "Need",
    icon: "🏗️",
    description: "Essentials",
    cityEffect: "Builds roads, schools & hospitals",
    color: "green",
    borderActive: "border-green-400",
    bgActive: "bg-green-500/20",
    textActive: "text-green-100",
    tip: "Needs are the foundation — spending here keeps your city functional and growing.",
  },
  {
    label: "Want",
    icon: "🎮",
    description: "Lifestyle",
    cityEffect: "Adds entertainment & neon life",
    color: "orange",
    borderActive: "border-orange-400",
    bgActive: "bg-orange-500/20",
    textActive: "text-orange-100",
    tip: "Wants add fun, but too much causes smog and city stress. Balance is key!",
  },
  {
    label: "Treat",
    icon: "🌳",
    description: "Wellbeing",
    cityEffect: "Adds parks, gyms & gardens",
    color: "purple",
    borderActive: "border-purple-400",
    bgActive: "bg-purple-500/20",
    textActive: "text-purple-100",
    tip: "Treats improve city resilience and happiness — green spaces make cities thrive.",
  },
  {
    label: "Invest",
    icon: "📈",
    description: "Growth",
    cityEffect: "Raises CBD towers & wealth",
    color: "blue",
    borderActive: "border-blue-400",
    bgActive: "bg-blue-500/20",
    textActive: "text-blue-100",
    tip: "Investing grows your skyline! The more you invest, the taller and richer your city becomes.",
  },
];

const FINANCIAL_WISDOM: Record<TransactionCategory, string[]> = {
  Need: [
    "Essential spending is the backbone of a healthy financial life! 🏗️",
    "You're building strong foundations — needs first, always.",
    "Smart move! Essentials keep you stable in rough times.",
  ],
  Want: [
    "Wants add colour to life, but keep them under 10-20% of spending 🎮",
    "Life is more fun with wants — just make sure needs come first!",
    "Entertainment is great! Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings.",
  ],
  Treat: [
    "Treating yourself is healthy — your city gets parks and green spaces! 🌳",
    "Wellbeing spending is an investment in yourself.",
    "Balance treats with savings — future you will be grateful!",
  ],
  Invest: [
    "Investing is how wealth grows over time! Watch your towers rise 📈",
    "Compound interest means investing early = skyscrapers later!",
    "Every dollar invested today grows — your city rewards you with gleaming towers.",
  ],
};

interface RangeOption {
  label: string;
  value: number;
  message: string;
}

const RANGE_OPTIONS: RangeOption[] = [
  { label: "Under $10",     value: 8,   message: "Light spending — foundations first." },
  { label: "$10 – $15",    value: 12.5, message: "Modest — solid and steady." },
  { label: "$15 – $25",    value: 20,   message: "Balanced — city humming along." },
  { label: "$25 – $35",    value: 30,   message: "Growing — watch your wants ratio." },
  { label: "$35 – $50",    value: 42,   message: "Lively — keep investing too!" },
  { label: "Over $50",     value: 65,   message: "Big spender — assets secure the sparkle." },
];

// City health score helper
function getCityHealthScore(
  needs: number, wants: number, investments: number, assets: number
): { score: number; label: string; color: string } {
  const total = needs + wants + investments + assets || 1;
  const n = needs / total;
  const w = wants / total;
  const inv = investments / total;
  const a = assets / total;

  // Ideal: needs 50%, invest 20%, assets 20%, wants 10%
  const penalty =
    Math.abs(n - 0.5) * 2 +
    Math.abs(inv - 0.2) * 2 +
    Math.abs(a - 0.2) * 2 +
    Math.abs(w - 0.1);
  const score = Math.max(0, Math.round(100 - penalty * 60));

  if (score >= 80) return { score, label: "Thriving", color: "#22c55e" };
  if (score >= 60) return { score, label: "Healthy",  color: "#3b82f6" };
  if (score >= 40) return { score, label: "Strained", color: "#f59e0b" };
  return { score, label: "At Risk", color: "#ef4444" };
}

interface SpendingFormProps {
  onTransactionProcessed?: (response: TransactionApiResponse) => Promise<void> | void;
}

export function SpendingForm({ onTransactionProcessed }: SpendingFormProps) {
  const setCityMetrics    = useCityStore((state) => state.setCityMetrics);
  const setFinanceMetrics = useCityStore((state) => state.setFinanceMetrics);
  const setSkyMode        = useCityStore((state) => state.setSkyMode);
  const financeMetrics    = useCityStore((state) => state.financeMetrics);

  const [selectedRangeIndex, setSelectedRangeIndex] = useState(0);
  const [category, setCategory] = useState<TransactionCategory>("Need");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [wisdomIndex, setWisdomIndex] = useState(0);
  const [lastCategory, setLastCategory] = useState<TransactionCategory | null>(null);

  const activeCat = CATEGORIES.find((c) => c.label === category)!;
  const health = getCityHealthScore(
    financeMetrics.needs, financeMetrics.wants,
    financeMetrics.investments, financeMetrics.assets
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const selectedRange = RANGE_OPTIONS[selectedRangeIndex];
      const response = await fetch("/api/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: selectedRange.value, category }),
      });

      if (!response.ok) {
        const err = (await response.json()) as { error?: string };
        throw new Error(err.error ?? "Unable to save transaction.");
      }

      const payload = (await response.json()) as TransactionApiResponse;
      setCityMetrics(payload.cityMetrics);
      setFinanceMetrics({
        needs:       payload.ratios.needs_ratio * 100,
        wants:       payload.ratios.wants_ratio * 100,
        investments: payload.ratios.invest_ratio * 100,
        assets:      payload.ratios.treat_ratio * 100,
      });

      localStorage.setItem("finquest-ratios",       JSON.stringify(payload.ratios));
      localStorage.setItem("finquest-city-metrics", JSON.stringify(payload.cityMetrics));

      await onTransactionProcessed?.(payload);

      // Pick a wisdom message
      const msgs = FINANCIAL_WISDOM[category];
      setWisdomIndex(Math.floor(Math.random() * msgs.length));
      setLastCategory(category);

      setFeedback(
        payload.mode === "supabase"
          ? `${selectedRange.message}`
          : `Preview mode — ${selectedRange.message}`
      );
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const wisdomMsg = lastCategory
    ? FINANCIAL_WISDOM[lastCategory][wisdomIndex]
    : null;

  return (
    <div className="glass-card rounded-[2rem] p-5 sm:p-6 flex flex-col gap-5">
      {/* Header */}
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
          Log Spending
        </p>
        <h2 className="mt-1 text-xl font-semibold text-white">
          Every purchase shapes your city
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-400">
          Log a transaction and watch your city respond in real-time.
        </p>
      </div>

      {/* City health meter */}
      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400 uppercase tracking-widest">City Health</span>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ color: health.color, background: `${health.color}22` }}
          >
            {health.label} · {health.score}/100
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${health.score}%`, background: health.color }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">
          Tip: Aim for ~50% needs · ~20% invest · ~20% treats · ~10% wants
        </p>
      </div>

      {/* Amount range */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">
            Amount range
          </span>
          <select
            value={selectedRangeIndex}
            onChange={(e) => setSelectedRangeIndex(Number(e.target.value))}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-base text-white outline-none transition focus:border-sky-400"
          >
            {RANGE_OPTIONS.map((opt, i) => (
              <option key={opt.label} value={i}>{opt.label}</option>
            ))}
          </select>
        </label>

        {/* Category picker */}
        <div>
          <span className="mb-2 block text-sm font-medium text-slate-200">
            Category
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            {CATEGORIES.map((cat) => {
              const isActive = cat.label === category;
              return (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => {
                    setCategory(cat.label);
                    setSkyMode(cat.label === "Want" ? "night" : "day");
                  }}
                  className={`rounded-2xl border px-3 py-2.5 text-sm font-medium transition-all duration-200 text-left
                    ${isActive
                      ? `${cat.borderActive} ${cat.bgActive} ${cat.textActive}`
                      : "border-white/10 bg-slate-900/70 text-slate-300 hover:border-white/20"
                    }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-base">{cat.icon}</span>
                    <span className="font-semibold">{cat.label}</span>
                  </div>
                  <p className="text-[11px] opacity-70 leading-4">
                    {isActive ? cat.cityEffect : cat.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected category tip */}
        <div className={`rounded-xl border px-3 py-2.5 text-[12px] leading-5 transition-all duration-300
          ${activeCat.bgActive} ${activeCat.borderActive} ${activeCat.textActive} opacity-90`}>
          <span className="mr-1">{activeCat.icon}</span>
          {activeCat.tip}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-400 px-4 py-3.5 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-50 hover:opacity-90 active:scale-[0.98]"
        >
          {isSubmitting ? "Updating City…" : "Submit Transaction ⚡"}
        </button>

        {/* Wisdom after submit */}
        {wisdomMsg && (
          <div className="rounded-xl bg-slate-800/60 border border-white/10 px-3.5 py-3 text-sm leading-6 text-slate-200">
            {wisdomMsg}
          </div>
        )}

        {/* Range message */}
        {feedback && !wisdomMsg && (
          <p className="text-sm leading-6 text-slate-300">{feedback}</p>
        )}
      </form>
    </div>
  );
}