"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import { CityScene } from "@/components/city/CityScene";
import { SpendingForm } from "@/components/spending/SpendingForm";
import { useAuth } from "@/hooks/useAuth";
import { useCityStore } from "@/store/useCityStore";
import type { DashboardPayload, TransactionApiResponse } from "@/types";

export default function CityPage() {
  const { user, loading } = useAuth();
  const cityMetrics = useCityStore((state) => state.cityMetrics);
  const setCityMetrics = useCityStore((state) => state.setCityMetrics);
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    async function loadCity() {
      try {
        const response = await fetch("/api/transaction");

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error || "Unable to load city.");
        }

        const payload = (await response.json()) as DashboardPayload;
        setDashboard(payload);
        setCityMetrics(payload.cityMetrics);
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : "Unable to load city.",
        );
      }
    }

    loadCity();
  }, [setCityMetrics, user]);

  function handleTransactionProcessed(payload: TransactionApiResponse) {
    setDashboard(payload);
    setCityMetrics(payload.cityMetrics);
  }

  if (loading) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-6">
        <div className="glass-card rounded-[2rem] p-6 text-slate-300">
          Loading city simulation...
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl px-5 py-10">
        <div className="glass-card rounded-[2rem] p-6">
          <h1 className="text-3xl font-semibold text-white">Login to enter your city</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            FinQuest now keeps a separate city for every player, so sign in before
            exploring the 3D simulation.
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

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-5 py-6 sm:max-w-6xl">
      <section className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
            3D City
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Watch your money habits shape the skyline
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Click structures for stats, hover for tooltips, and pan around to inspect districts.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/"
            className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-white"
          >
            Open Home Dashboard
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <CityScene />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="glass-card rounded-2xl p-4">
              <p className="text-sm text-slate-300">Economy</p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {cityMetrics.economyScore}
              </p>
            </div>
            <div className="glass-card rounded-2xl p-4">
              <p className="text-sm text-slate-300">Infrastructure</p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {cityMetrics.infrastructure}
              </p>
            </div>
            <div className="glass-card rounded-2xl p-4">
              <p className="text-sm text-slate-300">Pollution</p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {cityMetrics.pollution}
              </p>
            </div>
            <div className="glass-card rounded-2xl p-4">
              <p className="text-sm text-slate-300">Growth</p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {cityMetrics.growth}
              </p>
            </div>
          </div>

          {dashboard?.cityMetrics.emergencyWarning ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card mt-4 rounded-2xl border border-amber-400/20 p-4 text-sm text-amber-200"
            >
              Emergency warning: liquidity is low, so the city is flashing a stability alert.
            </motion.div>
          ) : null}
        </div>

        <div className="space-y-4">
          <SpendingForm onTransactionProcessed={handleTransactionProcessed} />
          {error ? (
            <div className="glass-card rounded-2xl p-4 text-sm text-rose-300">
              {error}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
