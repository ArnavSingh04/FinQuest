import { NextResponse } from "next/server";

import { generateInsight } from "@/lib/aiInsights";
import type { Proportions } from "@/types";

export async function POST(request: Request) {
  try {
    const proportions = (await request.json()) as Proportions;
    const insight = await generateInsight(proportions);
    return NextResponse.json({ insight });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate insight.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
