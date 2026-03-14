"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import type { DashboardPayload, Transaction } from "@/types";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const categoryColors: Record<Transaction["category"], string> = {
  Need: "bg-cat-need/20 text-cat-need",
  Want: "bg-cat-want/20 text-cat-want",
  Treat: "bg-cat-treat/20 text-cat-treat",
  Invest: "bg-cat-invest/20 text-cat-invest",
};

export function HistorySheetContent() {
  const { user, loading } = useAuth();
  const [payload, setPayload] = useState<DashboardPayload | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch("/api/transaction")
      .then(async (r) => (r.ok ? ((await r.json()) as DashboardPayload) : null))
      .then(setPayload);
  }, [user]);

  if (loading || !user) {
    return (
      <div className="px-4 py-8 text-center text-text-muted">
        {loading ? "Loading…" : "Log in to view history."}
      </div>
    );
  }

  const transactions = payload?.transactions ?? [];

  return (
    <div className="px-4 pb-6">
      <p className="text-sm text-text-secondary">
        {payload?.transactionCount ?? 0} transaction
        {(payload?.transactionCount ?? 0) !== 1 ? "s" : ""} ·{" "}
        {payload ? currencyFormatter.format(payload.totalSpent) : "—"} tracked
      </p>
      <ul className="mt-4 space-y-2">
        {transactions.slice(0, 20).map((tx) => (
          <li
            key={tx.id ?? `${tx.spent_at}-${tx.amount}`}
            className="flex items-center justify-between rounded-2xl border border-border bg-bg-surface px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${categoryColors[tx.category]}`}
              >
                {tx.category}
              </span>
              <span className="text-sm text-text-primary">
                {tx.merchant_name || "Transaction"}
              </span>
            </div>
            <span className="font-semibold text-text-primary">
              {currencyFormatter.format(tx.amount)}
            </span>
          </li>
        ))}
      </ul>
      {transactions.length === 0 && (
        <p className="mt-6 text-center text-sm text-text-muted">
          No transactions yet. Use Log Spend to add one.
        </p>
      )}
    </div>
  );
}
