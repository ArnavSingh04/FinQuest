"use client";

import { useEffect, useRef, useState } from "react";

import { useCityStore } from "@/store/useCityStore";
import { HAMMER_ANIMATION_DURATION } from "@/components/city/constants";
import type {
  TransactionApiResponse,
  TransactionCategory,
} from "@/types";

const categories: TransactionCategory[] = ["Need", "Want", "Treat", "Invest"];

interface RangeOption {
  label: string;
  value: number;
  boost: number;
  message: string;
}

const rangeOptions: RangeOption[] = [
  {
    label: "Less than $10",
    value: 8,
    boost: 0.4,
    message: "You're keeping needs under $10—great job on only spending on essentials.",
  },
  {
    label: "$10 - $15",
    value: 12.5,
    boost: 0.25,
    message: "Good job keeping the focus on needs; your discipline is building a strong skyline.",
  },
  {
    label: "$15 - $25",
    value: 20,
    boost: 0.15,
    message: "Solid essentials-first play; keep wants on hold and the skyline stays steady.",
  },
  {
    label: "$25 - $35",
    value: 30,
    boost: 0.1,
    message:
      "Needs spending is creeping higher; towers gain height but keep wants tightly reined in.",
  },
  {
    label: "$35 - $50",
    value: 42,
    boost: 0.1,
    message:
      "Needs-heavy territory; towers grow but this is your cue to curb wants before they spike.",
  },
  {
    label: "More than $50",
    value: 65,
    boost: 0.05,
    message:
      "Warning: needs spending is high; towers stretch a little but seriously restrain wants.",
  },
];

interface SpendingFormProps {
  onTransactionProcessed?: (response: TransactionApiResponse) => Promise<void> | void;
}

export function SpendingForm({ onTransactionProcessed }: SpendingFormProps) {
  const setCityMetrics = useCityStore((state) => state.setCityMetrics);
  const incrementNeedsBoostVersion = useCityStore(
    (state) => state.incrementNeedsBoostVersion,
  );
  const increaseHeightMultiplier = useCityStore(
    (state) => state.increaseHeightMultiplier,
  );
  const setSkyMode = useCityStore((state) => state.setSkyMode);
  const [selectedRangeIndex, setSelectedRangeIndex] = useState(0);
  const [category, setCategory] = useState<TransactionCategory>("Need");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const heightBoostTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDisabled = isSubmitting;

  useEffect(() => {
    return () => {
      if (heightBoostTimer.current) {
        clearTimeout(heightBoostTimer.current);
      }
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const selectedRange = rangeOptions[selectedRangeIndex];
      const response = await fetch("/api/transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: selectedRange.value,
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

      const baseFeedbackMessage =
        payload.mode === "supabase"
          ? "Transaction saved and city updated."
          : "Running in local preview mode until Supabase is configured.";

      if (category === "Need") {
        incrementNeedsBoostVersion();

        setFeedback("Hammer crews are prepping the skyline...");

        if (heightBoostTimer.current) {
          clearTimeout(heightBoostTimer.current);
        }

        heightBoostTimer.current = setTimeout(() => {
          increaseHeightMultiplier(selectedRange.boost);
          setFeedback(
            `${selectedRange.message} Tower heights increased by ${
              selectedRange.boost * 100
            }%. ${baseFeedbackMessage}`,
          );
          heightBoostTimer.current = null;
        }, HAMMER_ANIMATION_DURATION);
      } else {
        setFeedback(baseFeedbackMessage);
      }
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
          Amount range
        </span>
        <select
          value={selectedRangeIndex}
          onChange={(event) => setSelectedRangeIndex(Number(event.target.value))}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-base text-white outline-none transition focus:border-sky-400"
        >
          {rangeOptions.map((item, index) => (
            <option key={item.label} value={index}>
              {item.label}
            </option>
          ))}
        </select>
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
                onClick={() => {
                  setCategory(item);
                  if (item === "Want") {
                    setSkyMode("night");
                  } else {
                    setSkyMode("day");
                  }
                }}
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
