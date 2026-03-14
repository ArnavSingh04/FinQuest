"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useGameStore } from "@/store/useGameStore";
import { getCityTier } from "@/lib/cityLevel";

export function StatsSheetContent() {
  const cityState = useGameStore((s) => s.cityState);
  const [dashboard, setDashboard] = useState<{
    ratios: { needs_ratio: number; wants_ratio: number; treat_ratio: number; invest_ratio: number };
  } | null>(null);

  useEffect(() => {
    fetch("/api/transaction")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setDashboard(data));
  }, []);

  const tier = getCityTier(cityState.healthScore);
  const ratios = dashboard?.ratios ?? {
    needs_ratio: 0,
    wants_ratio: 0,
    treat_ratio: 0,
    invest_ratio: 0,
  };

  return (
    <div className="px-4 pb-6">
      <div className="rounded-2xl border border-border bg-bg-surface p-4">
        <p className="label text-text-muted">City tier</p>
        <p className="mt-1 font-heading text-xl font-normal text-text-primary">
          {tier.name} {tier.icon}
        </p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-bg-surface p-4">
          <p className="label text-text-muted">Health</p>
          <p className="mt-1 font-heading text-2xl font-normal text-text-primary">
            {cityState.healthScore}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-bg-surface p-4">
          <p className="label text-text-muted">Population</p>
          <p className="mt-1 font-heading text-2xl font-normal text-text-primary">
            {cityState.population * 100}k
          </p>
        </div>
      </div>
      <div className="mt-4">
        <p className="label text-text-muted">Spending mix</p>
        <div className="mt-2 space-y-2">
          {[
            { label: "Needs", value: ratios.needs_ratio, color: "bg-cat-need" },
            { label: "Wants", value: ratios.wants_ratio, color: "bg-cat-want" },
            { label: "Treats", value: ratios.treat_ratio, color: "bg-cat-treat" },
            { label: "Invest", value: ratios.invest_ratio, color: "bg-cat-invest" },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="w-16 text-sm text-text-secondary">{label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-border/30">
                <div
                  className={`h-full rounded-full ${color}`}
                  style={{ width: `${Math.min(100, value * 100)}%` }}
                />
              </div>
              <span className="text-sm font-medium text-text-secondary">
                {Math.round(value * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
      <Link
        href="/dashboard"
        className="mt-6 block rounded-2xl bg-accent-primary py-3 text-center text-sm font-semibold text-white"
      >
        Full dashboard
      </Link>
    </div>
  );
}
