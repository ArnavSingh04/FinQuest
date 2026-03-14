"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import { useAuth } from "@/hooks/useAuth";
import { useCityStore } from "@/store/useCityStore";
import type {
  AchievementState,
  DashboardPayload,
  InsightApiResponse,
  Transaction,
  TransactionApiResponse,
  TransactionCategory,
  UserMetrics,
} from "@/types";

const transactionCategories: TransactionCategory[] = [
  "Need",
  "Want",
  "Treat",
  "Invest",
];

const achievementDecor: Record<
  string,
  { badge: string; accent: string; unlockedAccent: string }
> = {
  "city-founder": {
    badge: "CF",
    accent: "border-white/5 bg-slate-950/20 text-slate-500",
    unlockedAccent: "border-amber-300/40 bg-amber-400/10 text-amber-100",
  },
  "first-investment": {
    badge: "FI",
    accent: "border-white/5 bg-slate-950/20 text-slate-500",
    unlockedAccent: "border-emerald-300/40 bg-emerald-400/10 text-emerald-100",
  },
  "disciplined-saver": {
    badge: "DS",
    accent: "border-white/5 bg-slate-950/20 text-slate-500",
    unlockedAccent: "border-sky-300/40 bg-sky-400/10 text-sky-100",
  },
  "balanced-budget": {
    badge: "BB",
    accent: "border-white/5 bg-slate-950/20 text-slate-500",
    unlockedAccent: "border-cyan-300/40 bg-cyan-400/10 text-cyan-100",
  },
  "city-thriving": {
    badge: "CT",
    accent: "border-white/5 bg-slate-950/20 text-slate-500",
    unlockedAccent: "border-fuchsia-300/40 bg-fuchsia-400/10 text-fuchsia-100",
  },
  "clean-streak": {
    badge: "CS",
    accent: "border-white/5 bg-slate-950/20 text-slate-500",
    unlockedAccent: "border-teal-300/40 bg-teal-400/10 text-teal-100",
  },
  tycoon: {
    badge: "TY",
    accent: "border-white/5 bg-slate-950/20 text-slate-500",
    unlockedAccent: "border-violet-300/40 bg-violet-400/10 text-violet-100",
  },
};

const categoryBadgeStyles: Record<TransactionCategory, string> = {
  Need: "border-sky-400/30 bg-sky-500/10 text-sky-100",
  Want: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  Treat: "border-rose-400/30 bg-rose-500/10 text-rose-100",
  Invest: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function createInsightPayload(data: DashboardPayload): UserMetrics {
  return {
    ratios: data.ratios,
    scores: data.scores,
    cityMetrics: data.cityMetrics,
    transactionCount: data.transactionCount,
    totalSpent: data.totalSpent,
  };
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

function getSettlementLabel(level: number) {
  if (level >= 6) {
    return "Metro";
  }

  if (level >= 5) {
    return "City";
  }

  if (level >= 4) {
    return "Town";
  }

  if (level >= 2) {
    return "Village";
  }

  return "Outpost";
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

function getHealthScore(payload: DashboardPayload) {
  return Math.round(
    (payload.scores.budgetHealth +
      payload.scores.stability +
      payload.cityMetrics.economyScore) /
      3,
  );
}

function getStreakDays(transactions: Transaction[]) {
  if (transactions.length === 0) {
    return 0;
  }

  const daySet = new Set(
    transactions
      .map((transaction) => transaction.spent_at || transaction.created_at)
      .filter(Boolean)
      .map((value) => new Date(value!).toDateString()),
  );

  const latestTimestamp = transactions
    .map((transaction) => transaction.spent_at || transaction.created_at)
    .filter(Boolean)
    .map((value) => new Date(value!).getTime())
    .sort((a, b) => b - a)[0];

  if (!latestTimestamp) {
    return 0;
  }

  let streak = 0;
  const cursor = new Date(latestTimestamp);

  while (daySet.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getWeeklyTransactions(transactions: Transaction[]) {
  const now = Date.now();
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

  return transactions.filter((transaction) => {
    const timestamp = transaction.spent_at || transaction.created_at;

    if (!timestamp) {
      return false;
    }

    return now - new Date(timestamp).getTime() <= oneWeekMs;
  });
}

function getTopCategory(transactions: Transaction[]) {
  if (transactions.length === 0) {
    return null;
  }

  const totals = transactions.reduce<Record<TransactionCategory, number>>(
    (accumulator, transaction) => {
      accumulator[transaction.category] += Number(transaction.amount || 0);
      return accumulator;
    },
    {
      Need: 0,
      Want: 0,
      Treat: 0,
      Invest: 0,
    },
  );

  return Object.entries(totals).sort((a, b) => b[1] - a[1])[0] as
    | [TransactionCategory, number]
    | undefined;
}

function buildConicGradient(payload: DashboardPayload) {
  const ratios = [
    { color: "#38bdf8", value: payload.ratios.needs_ratio },
    { color: "#f59e0b", value: payload.ratios.wants_ratio },
    { color: "#fb7185", value: payload.ratios.treat_ratio },
    { color: "#34d399", value: payload.ratios.invest_ratio },
  ];

  let start = 0;
  const stops = ratios.map((entry) => {
    const end = start + entry.value * 100;
    const segment = `${entry.color} ${start}% ${end}%`;
    start = end;
    return segment;
  });

  if (start < 100) {
    stops.push(`#1e293b ${start}% 100%`);
  }

  return `conic-gradient(${stops.join(", ")})`;
}

function buildFinancialTip(payload: DashboardPayload) {
  return (
    payload.latestInsight?.lesson || {
      title: "Lifestyle Creep",
      lessonText:
        "When income rises, spending tends to rise with it. Keep your core living costs steady and let extra money strengthen your future city.",
    }
  );
}

function RuleCard({
  title,
  subtitle,
  actual,
  targetLabel,
  marker,
  status,
  tone,
}: {
  title: string;
  subtitle: string;
  actual: number;
  targetLabel: string;
  marker: number;
  status: string;
  tone: string;
}) {
  return (
    <div className={`rounded-[1.75rem] border p-5 ${tone}`}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-xl font-semibold text-white">{title}</p>
        <p className="text-lg font-semibold text-white">{status}</p>
      </div>
      <div className="mt-4 h-4 rounded-full bg-slate-800/70 p-[2px]">
        <div className="relative h-full rounded-full bg-slate-700/70">
          <div
            className="h-full rounded-full bg-current"
            style={{ width: `${Math.min(100, Math.max(0, actual * 100))}%` }}
          />
          <div
            className="absolute inset-y-0 w-px bg-white/50"
            style={{ left: `${marker * 100}%` }}
          />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm text-slate-300">
        <span>{formatPercent(actual)} actual</span>
        <span>{targetLabel}</span>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-300">{subtitle}</p>
    </div>
  );
}

function AchievementCard({ achievement }: { achievement: AchievementState }) {
  const decor = achievementDecor[achievement.id] ?? {
    badge: "OK",
    accent: "border-white/5 bg-slate-950/20 text-slate-500",
    unlockedAccent: "border-emerald-300/40 bg-emerald-400/10 text-emerald-100",
  };

  const cardTone = achievement.unlocked
    ? decor.unlockedAccent
    : decor.accent;

  return (
    <div className={`rounded-[1.5rem] border p-4 ${cardTone}`}>
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-current/20 bg-white/5 text-sm font-semibold">
        {decor.badge}
      </div>
      <p className="text-xl font-semibold text-white">{achievement.title}</p>
      <p className="mt-1 text-sm text-slate-300">{achievement.description}</p>
    </div>
  );
}

export function FinanceLogsDashboard() {
  const { user, loading } = useAuth();
  const setCityMetrics = useCityStore((state) => state.setCityMetrics);
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [merchantName, setMerchantName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<TransactionCategory>("Need");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      setDashboard(null);
      setIsDashboardLoading(false);
      return;
    }

    let isMounted = true;

    async function loadDashboard() {
      setIsDashboardLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/transaction");

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error || "Unable to load dashboard.");
        }

        const payload = (await response.json()) as DashboardPayload;

        if (!isMounted) {
          return;
        }

        setDashboard(payload);
        setCityMetrics(payload.cityMetrics);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error ? loadError.message : "Unable to load dashboard.",
        );
      } finally {
        if (isMounted) {
          setIsDashboardLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [loading, setCityMetrics, user]);

  async function fetchInsight(data: DashboardPayload) {
    const response = await fetch("/api/insight", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createInsightPayload(data)),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      throw new Error(payload.error || "Unable to generate insight.");
    }

    return (await response.json()) as InsightApiResponse;
  }

  function syncDashboard(payload: DashboardPayload) {
    setDashboard(payload);
    setCityMetrics(payload.cityMetrics);
    localStorage.setItem("finquest-ratios", JSON.stringify(payload.ratios));
    localStorage.setItem("finquest-city-metrics", JSON.stringify(payload.cityMetrics));
    localStorage.setItem("finquest-progress", JSON.stringify(payload.progress));
  }

  async function attachLatestInsight(payload: DashboardPayload) {
    setIsInsightLoading(true);

    try {
      const latestInsight = await fetchInsight(payload);
      setDashboard((current) =>
        current
          ? {
              ...current,
              latestInsight,
            }
          : {
              ...payload,
              latestInsight,
            },
      );
    } catch (insightError) {
      setError(
        insightError instanceof Error
          ? insightError.message
          : "Unable to generate insight.",
      );
    } finally {
      setIsInsightLoading(false);
    }
  }

  async function saveTransaction(input: {
    merchant_name?: string | null;
    amount: number;
    category: TransactionCategory;
    note?: string | null;
  }) {
    setIsSubmitting(true);
    setFeedback(null);
    setError(null);

    try {
      const response = await fetch("/api/transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to save transaction.");
      }

      const payload = (await response.json()) as TransactionApiResponse;
      syncDashboard(payload);
      await attachLatestInsight(payload);
      setFeedback(payload.warning || "Transaction logged successfully.");
      setMerchantName("");
      setAmount("");
      setCategory("Need");
      setNote("");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Unable to save transaction.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      setError("Enter a positive amount before logging a transaction.");
      return;
    }

    await saveTransaction({
      merchant_name: merchantName.trim() || null,
      amount: numericAmount,
      category,
      note: note.trim() || null,
    });
  }

  const derived = useMemo(() => {
    if (!dashboard) {
      return null;
    }

    const weeklyTransactions = getWeeklyTransactions(dashboard.transactions);
    const weeklySpend = weeklyTransactions.reduce(
      (total, transaction) => total + Number(transaction.amount || 0),
      0,
    );
    const weeklyTopCategory = getTopCategory(weeklyTransactions);
    const recentTransaction = dashboard.transactions[0] ?? null;
    const unlockedAchievements = dashboard.progress.achievements.filter(
      (achievement) => achievement.unlocked,
    ).length;
    const wantsTreatTotal =
      dashboard.ratios.wants_ratio + dashboard.ratios.treat_ratio;
    const restaurantsCount = dashboard.transactions.filter(
      (transaction) =>
        transaction.category === "Want" || transaction.category === "Treat",
    ).length;
    const monthlyTransactions = dashboard.transactions.filter((transaction) => {
      const timestamp = transaction.spent_at || transaction.created_at;

      if (!timestamp) {
        return false;
      }

      const date = new Date(timestamp);
      const now = new Date();

      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    });
    const monthlySpend = monthlyTransactions.reduce(
      (total, transaction) => total + Number(transaction.amount || 0),
      0,
    );

    return {
      healthScore: getHealthScore(dashboard),
      weather: getWeatherLabel(dashboard),
      settlement: getSettlementLabel(dashboard.progress.level),
      streakDays: getStreakDays(dashboard.transactions),
      population: getPopulationLabel(dashboard),
      restaurantsCount,
      weeklySpend,
      weeklyTopCategory,
      recentTransaction,
      unlockedAchievements,
      wantsTreatTotal,
      monthlySpend,
      spendingMixBackground: buildConicGradient(dashboard),
      financialTip: buildFinancialTip(dashboard),
    };
  }, [dashboard]);

  if (loading || isDashboardLoading) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-6">
        <div className="glass-card rounded-[2rem] p-6 text-slate-300">
          Loading finance logs...
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (!dashboard || !derived) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-6">
        <div className="glass-card rounded-[2rem] p-6 text-rose-300">
          {error || "Dashboard data is unavailable right now."}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-6">
      <section className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
            FinQuest
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-white">Dashboard</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/pay"
            className="rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:scale-[1.01]"
          >
            Tap to Pay
          </Link>
          <Link
            href="/city"
            className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/5"
          >
            Open City
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="space-y-6">
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="glass-card rounded-[2rem] p-5 sm:p-6"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
              Log Transaction
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-white">
              One tap, city reacts
            </h2>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-medium text-slate-300">
                Merchant
              </span>
              <input
                type="text"
                value={merchantName}
                onChange={(event) => setMerchantName(event.target.value)}
                placeholder="eg. Woolworths"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none transition focus:border-sky-400"
              />
            </label>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-medium text-slate-300">
                Amount
              </span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none transition focus:border-sky-400"
              />
            </label>

            <div className="mt-4">
              <span className="mb-2 block text-sm font-medium text-slate-300">
                Category
              </span>
              <div className="grid grid-cols-2 gap-3">
                {transactionCategories.map((item) => {
                  const isActive = item === category;

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCategory(item)}
                      className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                        isActive
                          ? "border-sky-400/40 bg-sky-500/15 text-white"
                          : "border-white/10 bg-slate-950/30 text-slate-300"
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-medium text-slate-300">
                Note
              </span>
              <textarea
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Optional context about this payment"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none transition focus:border-sky-400"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-5 w-full rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition disabled:opacity-60"
            >
              {isSubmitting ? "Logging..." : `Log as ${category}`}
            </button>

            {feedback ? (
              <p className="mt-4 text-sm text-emerald-200">{feedback}</p>
            ) : null}
          </motion.form>

          <section className="glass-card rounded-[2rem] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Monthly Budget
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-white">
                  {currencyFormatter.format(derived.monthlySpend)}
                </h3>
              </div>
              <a
                href="#financial-report"
                className="text-sm font-medium text-sky-300 transition hover:text-sky-200"
              >
                View report
              </a>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              This month&apos;s total spending feeds your budget health score and the
              50/30/20 report below.
            </p>
          </section>

          <section className="glass-card rounded-[2rem] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
                Recent
              </p>
              <Link
                href="/history"
                className="text-sm font-medium text-sky-300 transition hover:text-sky-200"
              >
                View all
              </Link>
            </div>

            {derived.recentTransaction ? (
              <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-white">
                    {derived.recentTransaction.merchant_name?.trim() ||
                      `${derived.recentTransaction.category} transaction`}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {derived.recentTransaction.spent_at ||
                    derived.recentTransaction.created_at
                      ? shortDateFormatter.format(
                          new Date(
                            derived.recentTransaction.spent_at ||
                              derived.recentTransaction.created_at!,
                          ),
                        )
                      : "Recently saved"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-white">
                    {currencyFormatter.format(derived.recentTransaction.amount)}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                    {derived.recentTransaction.category}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-300">
                Your latest payment will appear here.
              </p>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="glass-card rounded-[2rem] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
                  City Health
                </p>
                <div className="mt-3 flex items-end gap-3">
                  <p className="text-5xl font-semibold text-amber-300">
                    {derived.healthScore}
                  </p>
                  <p className="mb-1 text-sm text-slate-400">/ 100</p>
                </div>
              </div>
              <p className="text-sm text-slate-400">{derived.weather}</p>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400"
                style={{ width: `${derived.healthScore}%` }}
              />
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
              <span>A small settlement is taking shape.</span>
              <div className="text-right">
                <p>{derived.settlement}</p>
                <p>{derived.streakDays}d streak</p>
              </div>
            </div>
          </section>

          <section className="glass-card rounded-[2rem] p-5 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
              Spending Mix
            </p>
            <div className="mt-5 grid gap-6 sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-center">
              <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full border border-white/10 bg-slate-950/30">
                <div
                  className="flex h-28 w-28 items-center justify-center rounded-full"
                  style={{ background: derived.spendingMixBackground }}
                >
                  <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-slate-950 text-center">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                      Total
                    </span>
                    <span className="mt-1 text-lg font-semibold text-white">
                      {currencyFormatter.format(dashboard.totalSpent)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: "Needs", value: dashboard.ratios.needs_ratio, color: "bg-sky-400" },
                  { label: "Wants", value: dashboard.ratios.wants_ratio, color: "bg-amber-400" },
                  { label: "Treats", value: dashboard.ratios.treat_ratio, color: "bg-rose-400" },
                  { label: "Invest", value: dashboard.ratios.invest_ratio, color: "bg-emerald-400" },
                ].map((entry) => (
                  <div
                    key={entry.label}
                    className="flex items-center justify-between gap-4 text-sm"
                  >
                    <div className="flex items-center gap-3 text-slate-300">
                      <span className={`h-2.5 w-2.5 rounded-full ${entry.color}`} />
                      <span>{entry.label}</span>
                    </div>
                    <span className="font-semibold text-white">
                      {formatPercent(entry.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="glass-card rounded-[2rem] p-5 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
              This Week
            </p>
            <p className="mt-3 text-4xl font-semibold text-white">
              {currencyFormatter.format(derived.weeklySpend)}
            </p>
            {derived.weeklyTopCategory ? (
              <p className="mt-3 text-sm text-slate-300">
                Top category: {derived.weeklyTopCategory[0]} ·{" "}
                {currencyFormatter.format(derived.weeklyTopCategory[1])}
              </p>
            ) : (
              <p className="mt-3 text-sm text-slate-300">
                New transactions this week will appear here.
              </p>
            )}
          </section>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="glass-card rounded-[1.5rem] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Weather</p>
              <p className="mt-2 text-2xl font-semibold text-white">{derived.weather}</p>
            </div>
            <div className="glass-card rounded-[1.5rem] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Population</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {derived.population}
              </p>
            </div>
            <div className="glass-card rounded-[1.5rem] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Restaurants
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {derived.restaurantsCount}
              </p>
            </div>
          </div>

          <section className="glass-card rounded-[2rem] p-5 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
              Advisor
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              {isInsightLoading
                ? "Generating fresh advice..."
                : dashboard.latestInsight?.insight ||
                  "Log a payment to unlock your first AI coach insight."}
            </p>
          </section>

          <a
            href="#financial-report"
            className="glass-card flex items-center justify-between gap-4 rounded-[1.5rem] p-5 transition hover:border-white/20"
          >
            <div>
              <p className="text-xl font-semibold text-white">Financial Report</p>
              <p className="mt-1 text-sm text-slate-400">
                50/30/20 rule · badges · tips
              </p>
            </div>
            <span className="text-xl text-slate-400">→</span>
          </a>
        </div>
      </section>

      <section id="financial-report" className="mt-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
          FinQuest
        </p>
        <h2 className="mt-2 text-4xl font-semibold text-white">Financial Report</h2>
        <p className="mt-2 text-xl text-slate-300">
          50/30/20 analysis · achievement badges · financial tips
        </p>

        <div className="glass-card mt-6 rounded-[2rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
            50 / 30 / 20 Rule
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Classic guide: 50% needs · 30% wants + treats · 20% invest
          </p>

          <div className="mt-6 space-y-4">
            <RuleCard
              title="Needs"
              actual={dashboard.ratios.needs_ratio}
              marker={0.5}
              targetLabel="<= 50% target"
              status={dashboard.ratios.needs_ratio <= 0.5 ? "Pass" : "Adjust"}
              subtitle="Cover essentials first so your infrastructure stays resilient."
              tone="border-sky-400/30 bg-sky-500/10 text-sky-300"
            />
            <RuleCard
              title="Wants + Treats"
              actual={derived.wantsTreatTotal}
              marker={0.3}
              targetLabel="<= 30% target"
              status={derived.wantsTreatTotal <= 0.3 ? "Pass" : "Over"}
              subtitle="Keep lifestyle and impulse spending under control so progress can compound."
              tone="border-orange-400/30 bg-orange-500/10 text-orange-300"
            />
            <RuleCard
              title="Investments"
              actual={dashboard.ratios.invest_ratio}
              marker={0.2}
              targetLabel=">= 20% target"
              status={dashboard.ratios.invest_ratio >= 0.2 ? "Pass" : "Below"}
              subtitle="Invest or save consistently so future growth has room to build."
              tone="border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
            />
          </div>
        </div>
      </section>

      <section className="glass-card mt-8 rounded-[2rem] p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
          Achievements · {derived.unlockedAchievements}/
          {dashboard.progress.achievements.length}
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {dashboard.progress.achievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      </section>

      <section className="glass-card mt-8 rounded-[2rem] p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
          Financial Tip
        </p>
        <h3 className="mt-4 text-3xl font-semibold text-white">
          {derived.financialTip.title}
        </h3>
        <p className="mt-4 max-w-4xl text-xl leading-9 text-slate-300">
          {derived.financialTip.lessonText}
        </p>
      </section>

      {error ? (
        <section className="glass-card mt-6 rounded-[2rem] p-5 text-sm text-rose-300">
          {error}
        </section>
      ) : null}
    </main>
  );
}
