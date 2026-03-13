"use client";

import { useMemo, useState } from "react";

import { useCityStore } from "@/store/useCityStore";
import type {
  TransactionApiResponse,
  TransactionCategory,
} from "@/types";

const categories: TransactionCategory[] = ["Need", "Want", "Treat", "Invest"];

interface SpendingFormProps {
  onTransactionProcessed?: (response: TransactionApiResponse) => Promise<void> | void;
}

export function SpendingForm({ onTransactionProcessed }: SpendingFormProps) {
  const setCityMetrics = useCityStore((state) => state.setCityMetrics);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<TransactionCategory>("Need");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isDisabled = useMemo(() => {
    return Number(amount) <= 0 || isSubmitting;
  }, [amount, isSubmitting]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number(amount),
          category,
        }),
      });

      if (!response.ok) {
        const errorPayload = (await response.json()) as { error?: string };
        throw new Error(errorPayload.error || "Unable to save transaction.");
      }

      const payload = (await response.json()) as TransactionApiResponse;
      setCityMetrics(payload.cityMetrics);

      localStorage.setItem("finquest-ratios", JSON.stringify(payload.ratios));
      localStorage.setItem(
        "finquest-city-metrics",
        JSON.stringify(payload.cityMetrics),
      );

      await onTransactionProcessed?.(payload);

      setFeedback(
        payload.mode === "supabase"
          ? "Transaction saved and city updated."
          : "Running in local preview mode until Supabase is configured.",
      );
      setAmount("");
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-card rounded-[2rem] p-5 sm:p-6"
    >
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
          Log Spending
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          Turn a purchase into city growth
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Every transaction reshapes your city so teens can see how habits affect
          their future.
        </p>
      </div>

      <label className="mb-4 block">
        <span className="mb-2 block text-sm font-medium text-slate-200">
          Amount
        </span>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="12.50"
          className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-base text-white outline-none transition focus:border-sky-400"
        />
      </label>

      <div className="mb-5">
        <span className="mb-2 block text-sm font-medium text-slate-200">
          Category
        </span>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((item) => {
            const isActive = item === category;

            return (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "border-sky-400 bg-sky-500/20 text-sky-100"
                    : "border-white/10 bg-slate-900/70 text-slate-300"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="submit"
        disabled={isDisabled}
        className="w-full rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Updating City..." : "Submit Transaction"}
      </button>

      {feedback ? (
        <p className="mt-4 text-sm leading-6 text-slate-300">{feedback}</p>
      ) : null}
    </form>
  );
}
