"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import { useUser } from "@/lib/auth";
import type { DashboardPayload, InsightApiResponse, UserMetrics } from "@/types";

function createInsightPayload(data: DashboardPayload): UserMetrics {
  return {
    ratios: data.ratios,
    scores: data.scores,
    cityMetrics: data.cityMetrics,
    transactionCount: data.transactionCount,
    totalSpent: data.totalSpent,
  };
}

export default function InsightsPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [insight, setInsight] = useState<InsightApiResponse | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    async function load() {
      try {
        const response = await fetch("/api/transaction");

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error || "Unable to load insight data.");
        }

        const payload = (await response.json()) as DashboardPayload;
        setDashboard(payload);
        if (payload.latestInsight) {
          setInsight(payload.latestInsight);
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load insight data.",
        );
      }
    }

    load();
  }, [user]);

  async function refreshInsight() {
    if (!dashboard) {
      return;
    }

    setIsRefreshing(true);
    setError(null);

    try {
      const response = await fetch("/api/insight", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createInsightPayload(dashboard)),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to refresh insight.");
      }

      setInsight((await response.json()) as InsightApiResponse);
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Unable to refresh insight.",
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  if (isUserLoading) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-6">
        <div className="glass-card rounded-[2rem] p-6 text-slate-300">
          Loading insights...
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl px-5 py-10">
        <div className="glass-card rounded-[2rem] p-6">
          <h1 className="text-3xl font-semibold text-white">Login to view insights</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Insights are personalized to each account, so sign in before generating coaching.
          </p>
          <div className="mt-6">
            <Link
              href="/login"
              className="rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950"
            >
              Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-6">
      <section className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
            Insights
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Learn from your financial patterns
          </h1>
        </div>
        <button
          type="button"
          onClick={refreshInsight}
          disabled={isRefreshing || !dashboard}
          className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isRefreshing ? "Refreshing..." : "Refresh Insight"}
        </button>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-[2rem] p-6"
      >
        <h2 className="text-2xl font-semibold text-white">AI Coach</h2>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          {insight?.insight ||
            "Generate your first insight after logging a transaction."}
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/30 p-4">
          <p className="text-sm font-semibold text-white">
            {insight?.lesson.title || "Financial lesson"}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {insight?.lesson.lessonText ||
              "Your next lesson will appear here after an AI insight is generated."}
          </p>
        </div>
      </motion.section>

      {dashboard ? (
        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="glass-card rounded-2xl p-4">
            <p className="text-sm text-slate-300">Liquidity</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {dashboard.scores.liquidity}
            </p>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <p className="text-sm text-slate-300">Budget Health</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {dashboard.scores.budgetHealth}
            </p>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <p className="text-sm text-slate-300">Investment Growth</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {dashboard.scores.investmentGrowth}
            </p>
          </div>
        </section>
      ) : null}

      {error ? (
        <div className="glass-card mt-6 rounded-2xl p-4 text-sm text-rose-300">
          {error}
        </div>
      ) : null}
    </main>
  );
}
