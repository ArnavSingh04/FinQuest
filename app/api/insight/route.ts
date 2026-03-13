import { NextResponse } from "next/server";

import { generateInsightFromRatios } from "@/lib/aiInsights";
import type { InsightApiResponse, SpendingRatios } from "@/types";

export async function POST(request: Request) {
  try {
    const ratios = (await request.json()) as SpendingRatios;
    const insight = await generateInsightFromRatios(ratios);

    return NextResponse.json<InsightApiResponse>({
      insight,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to generate insight.";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 },
    );
  }
}
