"use client";

import { useEffect } from "react";
import Link from "next/link";

import { CityScene } from "@/components/city/CityScene";
import { SpendingForm } from "@/components/spending/SpendingForm";
import { useGameStore } from "@/store/useGameStore";
import type { Proportions } from "@/types";

async function fetchAdvisorMessage(proportions: Proportions): Promise<string> {
  const res = await fetch("/api/insight", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(proportions),
  });
  if (!res.ok) throw new Error("Advisor unavailable");
  const data = (await res.json()) as { insight: string };
  return data.insight;
}

export default function CityPage() {
  const { cityState, loadFromStorage, setAdvisorMessage, setAdvisorLoading } = useGameStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  async function handleSubmitted(proportions: Proportions) {
    setAdvisorLoading(true);
    try {
      const msg = await fetchAdvisorMessage(proportions);
      setAdvisorMessage(msg);
    } catch {
      // ignore
    } finally {
      setAdvisorLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 py-6 sm:max-w-6xl sm:px-6">
      <header className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">FinQuest</p>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Your 3D City</h1>
        </div>
        <Link
          href="/dashboard"
          className="shrink-0 rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/5"
        >
          Dashboard →
        </Link>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        {/* City */}
        <div className="flex flex-col gap-4">
          <CityScene height="h-[520px]" />

          {/* Weather + health strip */}
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-card rounded-2xl p-3 text-center">
              <p className="text-xs text-slate-400">Weather</p>
              <p className="mt-0.5 text-sm font-semibold capitalize text-white">{cityState.weather}</p>
            </div>
            <div className="glass-card rounded-2xl p-3 text-center">
              <p className="text-xs text-slate-400">Health</p>
              <p className="mt-0.5 text-sm font-semibold text-white">{cityState.healthScore}</p>
            </div>
            <div className="glass-card rounded-2xl p-3 text-center">
              <p className="text-xs text-slate-400">Population</p>
              <p className="mt-0.5 text-sm font-semibold text-white">{cityState.population * 100}k</p>
            </div>
          </div>
        </div>

        {/* Spending form */}
        <SpendingForm onSubmitted={handleSubmitted} />
      </div>
    </main>
  );
}
