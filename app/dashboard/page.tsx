"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { StatsCard } from "@/components/dashboard/StatsCard";
import { SpendingForm } from "@/components/spending/SpendingForm";
import { useCityStore } from "@/store/useCityStore";
import type {
  CityMetrics,
  SpendingRatios,
  TransactionApiResponse,
} from "@/types";

const emptyRatios: SpendingRatios = {
  needs_ratio: 0,
  wants_ratio: 0,
  treat_ratio: 0,
  invest_ratio: 0,
};

async function fetchInsight(ratios: SpendingRatios) {
  const response = await fetch("/api/insight", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(ratios),
  });

  if (!response.ok) {
    throw new Error("Unable to generate insight.");
  }

  const payload = (await response.json()) as { insight: string };
  return payload.insight;
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export default function DashboardPage() {
  const cityMetrics = useCityStore((state) => state.cityMetrics);
  const setCityMetrics = useCityStore((state) => state.setCityMetrics);

  const [ratios, setRatios] = useState<SpendingRatios>(emptyRatios);
  const [insight, setInsight] = useState(
    "Start by logging a transaction and FinQuest will explain what your spending habits mean.",
  );
  const [isInsightLoading, setIsInsightLoading] = useState(false);

  useEffect(() => {
    const savedRatios = localStorage.getItem("finquest-ratios");
    const savedMetrics = localStorage.getItem("finquest-city-metrics");
    const savedInsight = localStorage.getItem("finquest-insight");

    if (savedRatios) {
      setRatios(JSON.parse(savedRatios) as SpendingRatios);
    }

    if (savedMetrics) {
      setCityMetrics(JSON.parse(savedMetrics) as CityMetrics);
    }

    if (savedInsight) {
      setInsight(savedInsight);
    }
  }, [setCityMetrics]);

  async function handleTransactionProcessed(payload: TransactionApiResponse) {
    setRatios(payload.ratios);
    setCityMetrics(payload.cityMetrics);
    setIsInsightLoading(true);

    try {
      const generatedInsight = await fetchInsight(payload.ratios);
      setInsight(generatedInsight);
      localStorage.setItem("finquest-insight", generatedInsight);
    } catch (error) {
      setInsight(
        error instanceof Error
          ? error.message
          : "We could not generate an insight right now.",
      );
    } finally {
      setIsInsightLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-5 py-6 sm:max-w-6xl">
      <section className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
            Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Spending insights for your city
          </h1>
        </div>
        <Link
          href="/city"
          className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-white"
        >
          Open City
        </Link>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <SpendingForm onTransactionProcessed={handleTransactionProcessed} />

        <div className="grid gap-4 sm:grid-cols-2">
          <StatsCard
            label="Needs Ratio"
            value={formatPercent(ratios.needs_ratio)}
            helperText="Essential spending keeps the city stable."
          />
          <StatsCard
            label="Wants Ratio"
            value={formatPercent(ratios.wants_ratio)}
            helperText="Lifestyle spending powers fun districts."
            accent="from-fuchsia-400/30 to-violet-400/10"
          />
          <StatsCard
            label="Treat Ratio"
            value={formatPercent(ratios.treat_ratio)}
            helperText="Too many treats increase city pollution."
            accent="from-orange-400/30 to-red-400/10"
          />
          <StatsCard
            label="Invest Ratio"
            value={formatPercent(ratios.invest_ratio)}
            helperText="Investing adds long-term growth potential."
            accent="from-emerald-400/30 to-green-400/10"
          />
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Housing"
          value={`${cityMetrics.housing}`}
          helperText="More responsible spending builds housing stock."
        />
        <StatsCard
          label="Entertainment"
          value={`${cityMetrics.entertainment}`}
          helperText="Wants spending makes the city brighter and louder."
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

      <section className="glass-card mt-6 rounded-[2rem] p-5 sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
          AI Insight
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          Coach mode for teenagers
        </h2>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          {isInsightLoading ? "Generating advice..." : insight}
        </p>
      </section>
    </main>
  );
}
