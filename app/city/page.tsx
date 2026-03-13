"use client";

import { useEffect } from "react";
import Link from "next/link";

import { CityScene } from "@/components/city/CityScene";
import { SpendingForm } from "@/components/spending/SpendingForm";
import { useCityStore } from "@/store/useCityStore";
import type { CityMetrics } from "@/types";

export default function CityPage() {
  const cityMetrics = useCityStore((state) => state.cityMetrics);
  const setCityMetrics = useCityStore((state) => state.setCityMetrics);

  useEffect(() => {
    const savedMetrics = localStorage.getItem("finquest-city-metrics");

    if (savedMetrics) {
      setCityMetrics(JSON.parse(savedMetrics) as CityMetrics);
    }
  }, [setCityMetrics]);

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
        </div>
        <Link
          href="/dashboard"
          className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-white"
        >
          Open Dashboard
        </Link>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <CityScene />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="glass-card rounded-2xl p-4">
              <p className="text-sm text-slate-300">Housing</p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {cityMetrics.housing}
              </p>
            </div>
            <div className="glass-card rounded-2xl p-4">
              <p className="text-sm text-slate-300">Entertainment</p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {cityMetrics.entertainment}
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
        </div>

        <SpendingForm />
      </section>
    </main>
  );
}
