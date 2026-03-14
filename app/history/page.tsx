"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import { useAuth } from "@/hooks/useAuth";
import type { DashboardPayload, Transaction } from "@/types";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

const categoryStyles: Record<Transaction["category"], string> = {
  Need: "bg-sky-400/20 text-sky-200",
  Want: "bg-amber-400/20 text-amber-200",
  Treat: "bg-rose-400/20 text-rose-200",
  Invest: "bg-emerald-400/20 text-emerald-200",
};

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function getWeatherLabel(payload: DashboardPayload) {
  if (payload.cityMetrics.emergencyWarning) {
    return "Storm";
  }

  if (payload.cityMetrics.pollution >= 70) {
    return "Smog";
  }

  if (payload.cityMetrics.growth >= 70 && payload.cityMetrics.pollution <= 30) {
    return "Sunny";
  }

  if (payload.scores.stability >= 60) {
    return "Clear";
  }

  return "Cloudy";
}

function getPopulationLabel(payload: DashboardPayload) {
  const estimate = Math.max(
    18,
    Math.round(
      (payload.cityMetrics.growth * 1400 +
        payload.cityMetrics.infrastructure * 900 +
        payload.cityMetrics.stability * 700) /
        1000,
    ),
  );

  return `${estimate}k`;
}

function RatioRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_3rem] items-center gap-3">
      <p className="text-sm text-slate-300">{label}</p>
      <div className="h-2 overflow-hidden rounded-full bg-white/8">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${tone}`}
          style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
        />
      </div>
      <p className="text-right text-sm font-medium text-slate-200">
        {formatPercent(value)}
      </p>
    </div>
  );
}

function TransactionCard({ transaction }: { transaction: Transaction }) {
  const title =
    transaction.merchant_name?.trim() || `${transaction.category} transaction`;
  const subtitleParts = [
    transaction.spent_at ? dateFormatter.format(new Date(transaction.spent_at)) : null,
    transaction.note?.trim() || null,
  ].filter(Boolean);

  return (
    <div className="glass-card flex items-start justify-between gap-4 rounded-[1.75rem] p-4">
      <div className="flex min-w-0 items-start gap-3">
        <div
          className={`mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-xs font-semibold ${categoryStyles[transaction.category]}`}
        >
          {transaction.category.slice(0, 1)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-white">{title}</p>
          <p className="mt-1 text-sm text-slate-400">
            {subtitleParts.length > 0 ? subtitleParts.join(" · ") : "Saved to your history"}
          </p>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-base font-semibold text-white">
          {currencyFormatter.format(transaction.amount)}
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
          {transaction.category}
        </p>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadHistory() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/transaction");

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error || "Unable to load transaction history.");
        }

        const payload = (await response.json()) as DashboardPayload;

        if (!isMounted) {
          return;
        }

        setDashboard(payload);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load transaction history.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [loading, user]);

  const summary = useMemo(() => {
    if (!dashboard) {
      return null;
    }

    const healthScore = Math.round(
      (dashboard.scores.budgetHealth +
        dashboard.scores.stability +
        dashboard.cityMetrics.economyScore) /
        3,
    );

    return {
      healthScore,
      weather: getWeatherLabel(dashboard),
      population: getPopulationLabel(dashboard),
    };
  }, [dashboard]);

  async function handleReset() {
    if (!dashboard || dashboard.transactions.length === 0 || isResetting) {
      return;
    }

    const confirmed = window.confirm(
      "Reset all saved transactions, city history, achievements, and insights?",
    );

    if (!confirmed) {
      return;
    }

    setIsResetting(true);
    setError(null);

    try {
      const response = await fetch("/api/transaction", {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to reset your history.");
      }

      const payload = (await response.json()) as DashboardPayload;
      setDashboard(payload);
      localStorage.setItem("finquest-ratios", JSON.stringify(payload.ratios));
      localStorage.setItem("finquest-city-metrics", JSON.stringify(payload.cityMetrics));
      localStorage.setItem("finquest-progress", JSON.stringify(payload.progress));
    } catch (resetError) {
      setError(
        resetError instanceof Error
          ? resetError.message
          : "Unable to reset your history.",
      );
    } finally {
      setIsResetting(false);
    }
  }

  if (loading || isLoading) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-6">
        <div className="glass-card rounded-[2rem] p-6 text-slate-300">
          Loading transaction history...
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl px-5 py-10">
        <div className="glass-card rounded-[2rem] p-6">
          <h1 className="text-3xl font-semibold text-white">Login to view your history</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Your transaction timeline is tied to your FinQuest account.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/login"
              className="rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white"
            >
              Sign up
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!dashboard) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-6">
        <div className="glass-card rounded-[2rem] p-6 text-rose-300">
          {error || "History data is unavailable right now."}
        </div>
      </main>
    );
  }

  const ratios: Array<{
    label: string;
    value: number;
    tone: string;
  }> = [
    { label: "Needs", value: dashboard.ratios.needs_ratio, tone: "from-sky-400 to-cyan-300" },
    { label: "Wants", value: dashboard.ratios.wants_ratio, tone: "from-amber-400 to-orange-300" },
    { label: "Treat", value: dashboard.ratios.treat_ratio, tone: "from-rose-400 to-pink-300" },
    { label: "Invest", value: dashboard.ratios.invest_ratio, tone: "from-emerald-400 to-lime-300" },
  ];

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-5 py-6">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
          FinQuest
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Transaction History</h1>
        <p className="mt-2 text-sm text-slate-300">
          {dashboard.transactionCount} transaction
          {dashboard.transactionCount === 1 ? "" : "s"} ·{" "}
          {currencyFormatter.format(dashboard.totalSpent)} tracked
        </p>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-[2rem] p-5 sm:p-6"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
          Spending Breakdown
        </p>

        <div className="mt-5 space-y-4">
          {ratios.map((ratio) => (
            <RatioRow
              key={ratio.label}
              label={ratio.label}
              value={ratio.value}
              tone={ratio.tone}
            />
          ))}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-white/10 pt-5">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Health Score
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {summary?.healthScore ?? 0}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Weather</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {summary?.weather ?? "Clear"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Population
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {summary?.population ?? "0k"}
            </p>
          </div>
        </div>
      </motion.section>

      <section className="mt-6 space-y-4">
        {dashboard.transactions.length > 0 ? (
          dashboard.transactions.map((transaction) => (
            <TransactionCard
              key={transaction.id ?? `${transaction.spent_at}-${transaction.amount}`}
              transaction={transaction}
            />
          ))
        ) : (
          <div className="glass-card rounded-[2rem] p-6 text-sm text-slate-300">
            No transactions yet. Log spending to build your history timeline.
          </div>
        )}
      </section>

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={handleReset}
          disabled={isResetting || dashboard.transactions.length === 0}
          className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isResetting ? "Resetting..." : "Reset all data"}
        </button>
      </div>

      {error ? (
        <div className="glass-card mt-6 rounded-[2rem] p-4 text-sm text-rose-300">
          {error}
        </div>
      ) : null}
    </main>
  );
}
