import { NextResponse } from "next/server";

import { generateCityMetrics } from "@/lib/cityEngine";
import { calculateSpendingRatios } from "@/lib/financeEngine";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";
import type {
  Transaction,
  TransactionApiResponse,
  TransactionCategory,
} from "@/types";

const validCategories: TransactionCategory[] = [
  "Need",
  "Want",
  "Treat",
  "Invest",
];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<Transaction>;
    const amount = Number(body.amount);
    const category = body.category;

    if (!amount || amount <= 0 || !category || !validCategories.includes(category)) {
      return NextResponse.json(
        {
          error: "Please send a positive amount and a valid category.",
        },
        { status: 400 },
      );
    }

    let transactions: Transaction[] = [
      {
        amount,
        category,
        created_at: new Date().toISOString(),
      },
    ];
    let mode: TransactionApiResponse["mode"] = "local-fallback";

    if (hasSupabaseEnv) {
      const insertResult = await supabase
        .from("transactions")
        .insert({
          amount,
          category,
        });

      if (insertResult.error) {
        throw insertResult.error;
      }

      const fetchResult = await supabase
        .from("transactions")
        .select("id, amount, category, created_at")
        .order("created_at", { ascending: false });

      if (fetchResult.error) {
        throw fetchResult.error;
      }

      transactions = (fetchResult.data ?? []) as Transaction[];
      mode = "supabase";
    }

    const ratios = calculateSpendingRatios(transactions);
    const cityMetrics = generateCityMetrics(ratios);

    return NextResponse.json<TransactionApiResponse>({
      cityMetrics,
      ratios,
      transactions,
      mode,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process transaction.";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 },
    );
  }
}
