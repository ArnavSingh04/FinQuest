"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";
import { useCityStore } from "@/store/useCityStore";
import type { TransactionApiResponse, TransactionCategory } from "@/types";

type AmountBucket =
  | "under-10"
  | "10-20"
  | "20-50"
  | "50-100"
  | "100-200"
  | "over-200";

const typeOptions: Array<{
  value: TransactionCategory;
  emoji: string;
  label: string;
  description: string;
}> = [
  { value: "Need", emoji: "🏠", label: "Need", description: "Rent, groceries, utilities" },
  { value: "Want", emoji: "🍕", label: "Want", description: "Dining out, entertainment" },
  { value: "Treat", emoji: "✨", label: "Treat", description: "Luxury, impulse buys" },
  {
    value: "Invest",
    emoji: "📈",
    label: "Investment",
    description: "Savings, stocks, education",
  },
];

const amountOptions: Array<{
  value: AmountBucket;
  label: string;
  description: string;
}> = [
  { value: "under-10", label: "<$10", description: "Less than $10" },
  { value: "10-20", label: "$10-$20", description: "Between $10 and $20" },
  { value: "20-50", label: "$20-$50", description: "Between $20 and $50" },
  { value: "50-100", label: "$50-$100", description: "Between $50 and $100" },
  { value: "100-200", label: "$100-$200", description: "Between $100 and $200" },
  { value: "over-200", label: ">$200", description: "More than $200" },
];

export default function PayPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const setCityMetrics = useCityStore((state) => state.setCityMetrics);
  const [amountBucket, setAmountBucket] = useState<AmountBucket | null>(null);
  const [category, setCategory] = useState<TransactionCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDisabled = useMemo(() => {
    return !amountBucket || !category || isSubmitting;
  }, [amountBucket, category, isSubmitting]);

  async function handleLogTransaction() {
    if (!amountBucket || !category) {
      setError("Pick a value class and transaction type first.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/pay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amountBucket,
          category,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to log transaction.");
      }

      const payload = (await response.json()) as TransactionApiResponse;

      setCityMetrics(payload.cityMetrics);
      localStorage.setItem("finquest-ratios", JSON.stringify(payload.ratios));
      localStorage.setItem("finquest-city-metrics", JSON.stringify(payload.cityMetrics));
      localStorage.setItem("finquest-progress", JSON.stringify(payload.progress));

      router.push("/");
      router.refresh();
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Unable to log transaction.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-5 py-6">
        <div className="glass-card w-full rounded-[2rem] p-6 text-slate-300">
          Loading quick pay...
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-5 py-6">
        <div className="glass-card w-full rounded-[2rem] p-6">
          <Link href="/" className="text-sm text-slate-400 transition hover:text-white">
            Back to home
          </Link>
          <h1 className="mt-5 text-3xl font-semibold text-white">Login to log a payment</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Quick pay saves directly to your city, so you need to be signed in first.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/login"
              className="rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950"
            >
              Login
            </Link>
            <Link
              href="/"
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white"
            >
              Exit
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_28%),linear-gradient(180deg,#0b1324_0%,#07111f_100%)] px-5 py-8 text-white">
      <div className="mx-auto w-full max-w-3xl">
        <section className="glass-card rounded-[2.25rem] border border-sky-400/15 px-5 py-6 shadow-[0_0_0_1px_rgba(56,189,248,0.05),0_30px_80px_rgba(2,6,23,0.55)] sm:px-8 sm:py-8">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-sm text-slate-400 transition hover:text-white"
          >
            Exit to home
          </button>

          <div className="mt-6">
            <h1 className="text-4xl font-semibold tracking-tight text-white">
              Log a Transaction
            </h1>
            <p className="mt-3 max-w-2xl text-base text-slate-400">
              Tap the value class, tap the transaction type, then save it.
            </p>
          </div>

          <div className="mt-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
              How big was it?
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {amountOptions.map((option) => {
                const isSelected = option.value === amountBucket;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setAmountBucket(option.value)}
                    className={`rounded-[1.5rem] border p-4 text-left transition ${
                      isSelected
                        ? "border-sky-400/50 bg-sky-500/12 shadow-[0_0_0_1px_rgba(56,189,248,0.08)]"
                        : "border-white/10 bg-slate-950/35 hover:border-white/20"
                    }`}
                  >
                    <p className="text-3xl font-semibold text-white">{option.label}</p>
                    <p className="mt-2 text-sm text-slate-400">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
              Type of spend
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {typeOptions.map((option) => {
                const isSelected = option.value === category;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setCategory(option.value)}
                    className={`rounded-[1.5rem] border p-5 text-left transition ${
                      isSelected
                        ? "border-sky-400/50 bg-sky-500/12 shadow-[0_0_0_1px_rgba(56,189,248,0.08)]"
                        : "border-white/10 bg-slate-950/35 hover:border-white/20"
                    }`}
                  >
                    <p className="text-3xl font-semibold text-white">
                      <span className="mr-2" aria-hidden="true">
                        {option.emoji}
                      </span>
                      {option.label}
                    </p>
                    <p className="mt-2 text-sm text-slate-400">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogTransaction}
            disabled={isDisabled}
            className="mt-10 w-full rounded-[1.5rem] bg-white/10 px-5 py-4 text-lg font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Logging..." : "Log Transaction"}
          </button>

          {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
        </section>
      </div>
    </main>
  );
}
