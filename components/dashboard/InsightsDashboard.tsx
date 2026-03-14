"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import { StatsCard } from "@/components/dashboard/StatsCard";
import { SpendingForm } from "@/components/spending/SpendingForm";
import { useAuth } from "@/hooks/useAuth";
import { useCityStore } from "@/store/useCityStore";
import type {
  DashboardPayload,
  InsightApiResponse,
  TransactionApiResponse,
  UserMetrics,
} from "@/types";

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

export function InsightsDashboard() {
  const { user, loading } = useAuth();
  const cityMetrics = useCityStore((state) => state.cityMetrics);
  const setCityMetrics = useCityStore((state) => state.setCityMetrics);
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInsightLoading, setIsInsightLoading] = useState(false);

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
          loadError instanceof Error
            ? loadError.message
            : "Unable to load dashboard.",
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

  async function handleTransactionProcessed(payload: TransactionApiResponse) {
    setDashboard(payload);
    setCityMetrics(payload.cityMetrics);
    setIsInsightLoading(true);
    setError(null);

    try {
      const generatedInsight = await fetchInsight(payload);
      setDashboard((current) =>
        current
          ? {
              ...current,
              latestInsight: generatedInsight,
            }
          : {
              ...payload,
              latestInsight: generatedInsight,
            },
      );
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to generate insight.",
      );
    } finally {
      setIsInsightLoading(false);
    }
  }

  if (loading || isDashboardLoading) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-6">
        <div className="glass-card rounded-[2rem] p-6 text-slate-300">
          Loading your insights dashboard...
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (!dashboard) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-6">
        <div className="glass-card rounded-[2rem] p-6 text-rose-300">
          {error || "Dashboard data is unavailable right now."}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-5 py-6 sm:max-w-6xl">
      <section className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
            Insights Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Welcome back, Mayor
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Log spending, grow your city, and learn from your latest patterns in one place.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/city"
            className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-white"
          >
            Open City
          </Link>
          <Link
            href="/groups"
            className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-white"
          >
            Groups
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div id="log-spending">
          <SpendingForm onTransactionProcessed={handleTransactionProcessed} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatsCard
            label="Needs Ratio"
            value={formatPercent(dashboard.ratios.needs_ratio)}
            helperText="Needs map to infrastructure and housing resilience."
          />
          <StatsCard
            label="Wants Ratio"
            value={formatPercent(dashboard.ratios.wants_ratio)}
            helperText="Lifestyle spending powers fun districts."
            accent="from-fuchsia-400/30 to-violet-400/10"
          />
          <StatsCard
            label="Treat Ratio"
            value={formatPercent(dashboard.ratios.treat_ratio)}
            helperText="Too many treats increase city pollution."
            accent="from-orange-400/30 to-red-400/10"
          />
          <StatsCard
            label="Invest Ratio"
            value={formatPercent(dashboard.ratios.invest_ratio)}
            helperText="Investing adds long-term growth potential."
            accent="from-emerald-400/30 to-green-400/10"
          />
        </div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card mt-6 rounded-[2rem] p-5 sm:p-6"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
              XP Progress
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Level {dashboard.progress.level}
            </h2>
          </div>
          <p className="text-sm text-slate-300">
            {dashboard.progress.xp} / {dashboard.progress.nextLevelXp} XP
          </p>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400"
            style={{
              width: `${Math.min(
                100,
                (dashboard.progress.xp / dashboard.progress.nextLevelXp) * 100,
              )}%`,
            }}
          />
        </div>
      </motion.section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Economy"
          value={`${cityMetrics.economyScore}`}
          helperText="Overall city economy derived from budget health and growth."
        />
        <StatsCard
          label="Infrastructure"
          value={`${cityMetrics.infrastructure}`}
          helperText="Needs spending keeps roads, homes, and services stable."
          accent="from-pink-400/30 to-violet-400/10"
        />
        <StatsCard
          label="Pollution"
          value={`${cityMetrics.pollution}`}
          helperText="Treat-heavy habits create visible smoke in the scene."
          accent="from-orange-400/30 to-red-400/10"
        />
        <StatsCard
          label="Growth"
          value={`${cityMetrics.growth}`}
          helperText="Investing increases skyline growth and ambition."
          accent="from-emerald-400/30 to-cyan-400/10"
        />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.7fr]">
        <div className="glass-card rounded-[2rem] p-5 sm:p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
            AI Insight
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Coach mode for teenagers
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            {isInsightLoading
              ? "Generating advice..."
              : dashboard.latestInsight?.insight ||
                "Log your first transaction to generate a personalized insight."}
          </p>
          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <p className="text-sm font-semibold text-white">
              {dashboard.latestInsight?.lesson.title || "Money Basics"}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {dashboard.latestInsight?.lesson.lessonText ||
                "Keep needs covered, control impulse treats, and invest steadily for long-term growth."}
            </p>
          </div>
        </div>

        <div className="glass-card rounded-[2rem] p-5 sm:p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
            Achievements
          </p>
          <div className="mt-4 space-y-3">
            {dashboard.progress.achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`rounded-2xl border p-4 ${
                  achievement.unlocked
                    ? "border-emerald-400/30 bg-emerald-500/10"
                    : "border-white/10 bg-slate-950/30"
                }`}
              >
                <p className="text-sm font-semibold text-white">{achievement.title}</p>
                <p className="mt-1 text-sm text-slate-300">
                  {achievement.description}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-sky-300">
                  {achievement.xpReward} XP
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {error ? (
        <section className="glass-card mt-6 rounded-[2rem] p-5 text-sm text-rose-300">
          {error}
        </section>
      ) : null}

      <section className="glass-card mt-6 rounded-[2rem] p-5 sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
          City Health
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <StatsCard
            label="Liquidity"
            value={`${dashboard.scores.liquidity}`}
            helperText="Liquidity measures how much flexibility your spending leaves you."
          />
          <StatsCard
            label="Budget Health"
            value={`${dashboard.scores.budgetHealth}`}
            helperText="Higher balance means the city can support fun without losing stability."
            accent="from-violet-400/30 to-sky-400/10"
          />
          <StatsCard
            label="Stability"
            value={`${dashboard.scores.stability}`}
            helperText={
              cityMetrics.emergencyWarning
                ? "Low liquidity triggered an emergency warning in the city."
                : "Stable finances keep the city calm and resilient."
            }
            accent="from-amber-400/30 to-orange-400/10"
          />
        </div>
      </section>
    </main>
  );
}
