"use client";

import { useEffect } from "react";
import { useGameStore } from "@/store/useGameStore";
import { FinancialReport } from "@/components/literacy/FinancialReport";

export default function LearnPage() {
  const { loadFromStorage } = useGameStore();
  useEffect(() => { loadFromStorage(); }, [loadFromStorage]);

  return (
    <main className="page-with-nav mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">FinQuest</p>
        <h1 className="mt-1 text-2xl font-bold text-white">Financial Report</h1>
        <p className="mt-1 text-sm text-slate-400">
          50/30/20 analysis · achievement badges · financial tips
        </p>
      </header>
      <FinancialReport />
    </main>
  );
}
