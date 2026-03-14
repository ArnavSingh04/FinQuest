import { NextResponse } from "next/server";

import {
  createQuickLogTransaction,
  getAuthenticatedUser,
  getErrorMessage,
  isQuickLogAmountBucket,
  validTransactionCategories,
} from "@/lib/server/transactionService";
import type { TransactionCategory } from "@/types";

interface QuickPayRequestBody {
  amountBucket?: string;
  category?: TransactionCategory;
}

export async function POST(request: Request) {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const body = (await request.json()) as QuickPayRequestBody;
    const amountBucket = body.amountBucket;
    const category = body.category;

    if (
      !amountBucket ||
      !isQuickLogAmountBucket(amountBucket) ||
      !category ||
      !validTransactionCategories.includes(category)
    ) {
      return NextResponse.json(
        {
          error: "Choose a transaction size and a valid transaction type.",
        },
        { status: 400 },
      );
    }

    const payload = await createQuickLogTransaction({
      supabase,
      userId: user.id,
      amountBucket,
      category,
    });

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
