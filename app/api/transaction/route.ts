import { NextResponse } from "next/server";

import {
  buildResponseForUser,
  createTransaction,
  getAuthenticatedUser,
  getErrorMessage,
  resetUserData,
  validTransactionCategories,
} from "@/lib/server/transactionService";
import type { DashboardPayload, Transaction } from "@/types";

export async function GET() {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const payload = await buildResponseForUser(user.id, supabase);

    return NextResponse.json<DashboardPayload>(payload);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const body = (await request.json()) as Partial<Transaction>;
    const amount = Number(body.amount);
    const category = body.category;

    if (
      !amount ||
      amount <= 0 ||
      !category ||
      !validTransactionCategories.includes(category)
    ) {
      return NextResponse.json(
        {
          error: "Please send a positive amount and a valid category.",
        },
        { status: 400 },
      );
    }

    const payload = await createTransaction({
      supabase,
      userId: user.id,
      amount,
      category,
      merchant_name: body.merchant_name ?? null,
      note: body.note ?? null,
      source: body.source ?? "manual",
    });

    return NextResponse.json(payload);
  } catch (error) {
    const message = getErrorMessage(error);

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const { user, error } = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const payload = await resetUserData(user.id);

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
