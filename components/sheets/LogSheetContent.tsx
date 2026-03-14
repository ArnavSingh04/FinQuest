"use client";

import { useGameStore } from "@/store/useGameStore";
import { useUIStore } from "@/store/useUIStore";
import type { TransactionApiResponse } from "@/types";

import { SpendingForm } from "@/components/spending/SpendingForm";

export function LogSheetContent() {
  const setActiveSheet = useUIStore((s) => s.setActiveSheet);
  const addTransaction = useGameStore((s) => s.addTransaction);

  function handleProcessed(payload: TransactionApiResponse) {
    const last = payload.transactions?.[payload.transactions.length - 1];
    if (last) {
      addTransaction({
        amount: last.amount,
        category: last.category,
        merchant_name: last.merchant_name ?? null,
      });
    }
    setActiveSheet(null);
  }

  return (
    <div className="px-4 pb-6">
      <SpendingForm onTransactionProcessed={handleProcessed} />
    </div>
  );
}
