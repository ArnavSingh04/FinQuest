"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useGameStore } from "@/store/useGameStore";
import { useUIStore } from "@/store/useUIStore";
import { getCityTier } from "@/lib/cityLevel";
import { EmptyState } from "@/components/ui/EmptyState";
import type { DashboardPayload, Transaction } from "@/types";

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function buildDonutGradient(payload: DashboardPayload) {
  const ratios = [
    { color: "var(--cat-need)", value: payload.ratios.needs_ratio },
    { color: "var(--cat-want)", value: payload.ratios.wants_ratio },
    { color: "var(--cat-treat)", value: payload.ratios.treat_ratio },
    { color: "var(--cat-invest)", value: payload.ratios.invest_ratio },
  ];
  let start = 0;
  const stops = ratios.map((entry) => {
    const end = start + entry.value * 100;
    const segment = `${entry.color} ${start}% ${end}%`;
    start = end;
    return segment;
  });
  if (start < 100) stops.push(`var(--border) ${start}% 100%`);
  return `conic-gradient(${stops.join(", ")})`;
}

const categoryDot: Record<Transaction["category"], string> = {
  Need: "bg-cat-need",
  Want: "bg-cat-want",
  Treat: "bg-cat-treat",
  Invest: "bg-cat-invest",
};

function StatCard({
  icon,
  label,
  value,
  trend,
  trendUp,
}: {
  icon: string;
  label: string;
  value: number;
  trend: string;
  trendUp: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-bg-elevated p-4 shadow-card">
      <p className="label flex items-center gap-1.5 text-text-muted">
        <span>{icon}</span> {label}
      </p>
      <p className="mt-1 font-heading text-2xl font-normal text-text-primary">{value}</p>
      <p className={`mt-1 text-xs font-medium ${trendUp ? "text-cat-invest" : "text-cat-treat"}`}>
        {trend} {trendUp ? "↑" : "↓"}
      </p>
    </div>
  );
}

export function StatsSheetContent() {
  const cityState = useGameStore((s) => s.cityState);
  const setActiveSheet = useUIStore((s) => s.setActiveSheet);
  const [payload, setPayload] = useState<DashboardPayload | null>(null);

  useEffect(() => {
    fetch("/api/transaction")
      .then(async (r) => (r.ok ? ((await r.json()) as DashboardPayload) : null))
      .then(setPayload);
  }, []);

  const tier = getCityTier(cityState.healthScore);
  const m = payload?.cityMetrics;
  const healthColor =
    cityState.healthScore >= 70
      ? "var(--cat-invest)"
      : cityState.healthScore >= 40
        ? "var(--cat-want)"
        : "var(--cat-treat)";

  return (
    <div className="px-4 pb-6">
      <h2 className="font-heading text-xl font-normal text-text-primary">
        Your City
      </h2>
      <p className="label mt-0.5 text-text-muted">{tier.name}</p>

      <div className="mt-4 flex items-baseline gap-1">
        <span
          className="font-heading font-normal text-text-primary"
          style={{ fontSize: 64, color: healthColor }}
        >
          {cityState.healthScore}
        </span>
        <span className="text-lg text-text-muted">/ 100</span>
      </div>

      <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-border/40">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, Math.max(0, cityState.healthScore))}%`,
            background: "var(--health-gradient)",
          }}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <StatCard
          icon="📊"
          label="Economy"
          value={m?.economyScore ?? 0}
          trend="vs last week"
          trendUp={(m?.economyScore ?? 0) >= 50}
        />
        <StatCard
          icon="🏗"
          label="Infrastructure"
          value={Math.round(m?.infrastructure ?? 0)}
          trend="vs last week"
          trendUp={(m?.infrastructure ?? 0) >= 50}
        />
        <StatCard
          icon="🌫"
          label="Pollution"
          value={Math.round(m?.pollution ?? 0)}
          trend="vs last week"
          trendUp={false}
        />
        <StatCard
          icon="📈"
          label="Growth"
          value={Math.round(m?.growth ?? 0)}
          trend="vs last week"
          trendUp={(m?.growth ?? 0) >= 50}
        />
      </div>

      <p className="label mt-6 text-text-muted">Spending Mix</p>
      <div className="mt-2 flex items-center gap-4">
        <div
          className="h-24 w-24 shrink-0 rounded-full border-4 border-bg-elevated shadow-card"
          style={{
            background: payload ? buildDonutGradient(payload) : "var(--border)",
          }}
        />
        <div className="flex flex-col gap-1.5 text-sm">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cat-need" /> Needs
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cat-want" /> Wants
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cat-treat" /> Treats
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cat-invest" /> Invest
          </span>
        </div>
      </div>

      <p className="label mt-6 text-text-muted">Recent Transactions</p>
      {(payload?.transactions ?? []).length === 0 ? (
        <EmptyState
          heading="No transactions yet"
          subtext="Use Log Spend to add a transaction and watch your city grow."
          ctaLabel="Log Spend"
          onCta={() => setActiveSheet("log")}
        />
      ) : (
        <ul className="mt-2 space-y-2">
          {(payload?.transactions ?? []).slice(0, 8).map((tx) => (
            <li
              key={tx.id ?? `${tx.spent_at}-${tx.amount}`}
              className="flex items-center justify-between rounded-xl border border-border bg-bg-surface px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${categoryDot[tx.category]}`}
                />
                <span className="text-sm text-text-primary">
                  {tx.merchant_name || "Transaction"}
                </span>
              </div>
              <span className="font-heading text-sm font-normal text-text-primary">
                {currencyFormatter.format(tx.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <FinancialReportCollapsible payload={payload} />

      <Link
        href="/dashboard"
        className="mt-6 block rounded-2xl bg-accent-primary py-3 text-center text-sm font-semibold text-white"
      >
        Full dashboard
      </Link>
    </div>
  );
}

function FinancialReportCollapsible({ payload }: { payload: DashboardPayload | null }) {
  const [open, setOpen] = useState(false);
  if (!payload) return null;
  const wantsTreatTotal = payload.ratios.wants_ratio + payload.ratios.treat_ratio;
  const tip = payload.latestInsight?.lesson ?? {
    title: "Lifestyle Creep",
    lessonText:
      "When income rises, spending tends to rise with it. Keep your core living costs steady and let extra money strengthen your future city.",
  };

  return (
    <div className="mt-6 rounded-2xl border border-border bg-bg-surface">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="label flex w-full items-center justify-between px-4 py-3 text-left text-text-muted"
      >
        Financial Report
        <span className="text-lg">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="border-t border-border px-4 pb-4 pt-2">
          <p className="label mt-2 text-text-muted">50 / 30 / 20 Rule</p>
          <p className="mt-1 text-xs text-text-secondary">
            50% needs · 30% wants + treats · 20% invest
          </p>
          <div className="mt-4 space-y-3">
            <RuleRow
              label="Needs"
              actual={payload.ratios.needs_ratio}
              target="≤ 50%"
              pass={payload.ratios.needs_ratio <= 0.5}
            />
            <RuleRow
              label="Wants + Treats"
              actual={wantsTreatTotal}
              target="≤ 30%"
              pass={wantsTreatTotal <= 0.3}
            />
            <RuleRow
              label="Invest"
              actual={payload.ratios.invest_ratio}
              target="≥ 20%"
              pass={payload.ratios.invest_ratio >= 0.2}
            />
          </div>
          <p className="label mt-4 text-text-muted">Tip</p>
          <p className="font-heading mt-1 text-base font-normal text-text-primary">
            {tip.title}
          </p>
          <p className="mt-1 text-sm text-text-secondary">{tip.lessonText}</p>
        </div>
      )}
    </div>
  );
}

function RuleRow({
  label,
  actual,
  target,
  pass,
}: {
  label: string;
  actual: number;
  target: string;
  pass: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-bg-elevated px-3 py-2">
      <span className="text-sm text-text-primary">{label}</span>
      <span className="font-heading text-sm font-normal text-text-primary">
        {formatPercent(actual)}
      </span>
      <span className={`text-xs font-medium ${pass ? "text-cat-invest" : "text-cat-treat"}`}>
        {target} {pass ? "✓" : ""}
      </span>
    </div>
  );
}
