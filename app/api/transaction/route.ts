import { NextResponse } from "next/server";

import { generateCityState } from "@/lib/cityEngine";
import { calculateProportions } from "@/lib/financeEngine";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";
import type { Transaction, TransactionCategory } from "@/types";

const validCategories: TransactionCategory[] = ["Need", "Want", "Treat", "Invest"];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<Transaction>;
    const amount = Number(body.amount);
    const category = body.category;

    if (!amount || amount <= 0 || !category || !validCategories.includes(category)) {
      return NextResponse.json(
        { error: "Please send a positive amount and a valid category." },
        { status: 400 },
      );
    }

    let transactions: Transaction[] = [{ amount, category, created_at: new Date().toISOString() }];

    if (hasSupabaseEnv) {
      const insertResult = await supabase.from("transactions").insert({ amount, category });
      if (insertResult.error) throw insertResult.error;

      const fetchResult = await supabase
        .from("transactions")
        .select("id, amount, category, created_at")
        .order("created_at", { ascending: false });
      if (fetchResult.error) throw fetchResult.error;

      transactions = (fetchResult.data ?? []) as Transaction[];
    }

    const proportions = calculateProportions(transactions);
    const cityState = generateCityState(proportions);

    return NextResponse.json({ cityState, proportions, transactions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process transaction.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
