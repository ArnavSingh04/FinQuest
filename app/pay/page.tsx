"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";
import type { TransactionApiResponse, TransactionCategory } from "@/types";

type AmountBucket =
  | "under-10"
  | "10-20"
  | "20-50"
  | "50-100"
  | "100-200"
  | "over-200";

const CATEGORY_COLORS: Record<TransactionCategory, { border: string; bg: string }> = {
  Need: { border: "#3B7DD8", bg: "#EBF2FC" },
  Want: { border: "#E8A020", bg: "#FDF3E0" },
  Treat: { border: "#D94F3D", bg: "#FCECEA" },
  Invest: { border: "#3DAB6A", bg: "#E8F7EE" },
};

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
  { value: "10-20", label: "$10–$20", description: "Between $10 and $20" },
  { value: "20-50", label: "$20–$50", description: "Between $20 and $50" },
  { value: "50-100", label: "$50–$100", description: "Between $50 and $100" },
  { value: "100-200", label: "$100–$200", description: "Between $100 and $200" },
  { value: "over-200", label: ">$200", description: "More than $200" },
];

export default function PayPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [amountBucket, setAmountBucket] = useState<AmountBucket | null>(null);
  const [category, setCategory] = useState<TransactionCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
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

      localStorage.setItem("finquest-ratios", JSON.stringify(payload.ratios));
      localStorage.setItem("finquest-city-metrics", JSON.stringify(payload.cityMetrics));
      localStorage.setItem("finquest-progress", JSON.stringify(payload.progress));

      setSuccess(true);
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1500);
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
      <main className="flex min-h-screen w-full items-center justify-center px-5 py-6" style={{ background: "#F2EDE3" }}>
        <div className="w-full max-w-[480px] rounded-[20px] border p-6" style={{ background: "#FFFFFF", borderColor: "#C8BFA8", color: "#4A6358" }}>
          Loading quick pay...
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center px-5 py-6" style={{ background: "#F2EDE3" }}>
        <div className="w-full max-w-[480px] rounded-[20px] border p-6" style={{ background: "#FFFFFF", borderColor: "#C8BFA8", boxShadow: "0 4px 24px rgba(28,58,46,0.08)" }}>
          <Link href="/" className="text-[13px] transition hover:underline" style={{ color: "#4A6358", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>
            ← Back to home
          </Link>
          <h1 className="mt-5 font-heading text-3xl font-normal" style={{ color: "#1C3A2E" }}>Login to log a payment</h1>
          <p className="mt-3 text-sm leading-6" style={{ color: "#4A6358", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>
            Quick pay saves directly to your city, so you need to be signed in first.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/login"
              className="rounded-full px-4 py-3 text-sm font-semibold text-white"
              style={{ background: "#C17B3F" }}
            >
              Login
            </Link>
            <Link
              href="/"
              className="rounded-full border-2 px-4 py-3 text-sm font-semibold"
              style={{ borderColor: "#1C3A2E", color: "#1C3A2E", background: "transparent" }}
            >
              Exit
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="flex min-h-screen w-full flex-col items-center justify-center px-5 py-8" style={{ background: "#F2EDE3" }}>
        <div className="flex max-w-[480px] flex-col items-center rounded-[20px] border p-8 text-center" style={{ background: "#FFFFFF", borderColor: "#C8BFA8", boxShadow: "0 4px 24px rgba(28,58,46,0.08)" }}>
          <span className="text-5xl" style={{ color: "#3DAB6A" }} aria-hidden>✓</span>
          <h1 className="mt-4 font-heading text-2xl font-normal" style={{ color: "#1C3A2E" }}>Transaction logged</h1>
          <p className="mt-2 text-sm leading-6" style={{ color: "#4A6358", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>
            Your city has been updated.
          </p>
          <Link
            href="/"
            className="mt-6 w-full max-w-xs rounded-full py-3 text-center text-sm font-semibold text-white"
            style={{ background: "#C17B3F" }}
          >
            Back to city
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full px-5 py-8" style={{ background: "#F2EDE3" }}>
      <div className="mx-auto w-full max-w-[480px] rounded-[20px] border p-6" style={{ background: "#FFFFFF", borderColor: "#C8BFA8", boxShadow: "0 4px 24px rgba(28,58,46,0.08)" }}>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-[13px] transition hover:underline"
          style={{ color: "#4A6358", fontFamily: "var(--font-body), DM Sans, sans-serif" }}
        >
          ← Exit to home
        </button>

        <div className="mt-6">
          <h1 className="font-heading text-[28px] font-normal" style={{ color: "#1C3A2E" }}>
            Log a Transaction
          </h1>
          <p className="mt-2 text-sm leading-6" style={{ color: "#4A6358", fontFamily: "var(--font-body), DM Sans, sans-serif", fontSize: 14 }}>
            Tap the transaction type, tap the value class, then save.
          </p>
        </div>

        {/* TYPE OF SPEND — first */}
        <div className="mt-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "#8A9E94", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>
            Type of spend
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {typeOptions.map((option) => {
              const isSelected = option.value === category;
              const style = isSelected ? CATEGORY_COLORS[option.value] : null;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setCategory(option.value)}
                  className="rounded-xl border-2 p-4 text-left transition"
                  style={{
                    background: style ? style.bg : "#E8E0D0",
                    borderColor: style ? style.border : "#C8BFA8",
                    borderRadius: 12,
                  }}
                >
                  <p className="text-base font-bold leading-tight" style={{ color: style ? style.border : "#1C3A2E", fontFamily: "var(--font-body), DM Sans, sans-serif", fontSize: 16 }}>
                    <span className="mr-2" aria-hidden="true">{option.emoji}</span>
                    {option.label}
                  </p>
                  <p className="mt-1 text-[13px]" style={{ color: "#8A9E94", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* HOW BIG WAS IT? — second */}
        <div className="mt-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "#8A9E94", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>
            How big was it?
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {amountOptions.map((option) => {
              const isSelected = option.value === amountBucket;
              const style = isSelected && category ? CATEGORY_COLORS[category] : null;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAmountBucket(option.value)}
                  className="rounded-xl border-2 p-4 text-left transition"
                  style={{
                    background: style ? style.bg : "#E8E0D0",
                    borderColor: style ? style.border : "#C8BFA8",
                    borderRadius: 12,
                  }}
                >
                  <p className="text-[15px] font-semibold" style={{ color: "#1C3A2E", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>
                    {option.label}
                  </p>
                  <p className="mt-1 text-[12px]" style={{ color: "#8A9E94", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogTransaction}
          disabled={isDisabled}
          className="mt-8 w-full rounded-full py-[15px] text-[15px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-70"
          style={{
            height: 52,
            fontFamily: "var(--font-body), DM Sans, sans-serif",
            ...(isDisabled
              ? { background: "#E8E0D0", color: "#8A9E94" }
              : category
                ? { background: CATEGORY_COLORS[category].border, color: "#FFFFFF" }
                : { background: "#E8E0D0", color: "#8A9E94" }),
          }}
        >
          {isSubmitting ? "Logging..." : "Log Transaction →"}
        </button>

        {error ? (
          <p className="mt-4 text-sm" style={{ color: "#D94F3D", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>
            {error}
          </p>
        ) : null}
      </div>
    </main>
  );
}
