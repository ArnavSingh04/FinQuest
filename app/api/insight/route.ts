import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/auth-server";
import { generateFinancialInsight } from "@/lib/aiInsights";
import type { InsightApiResponse, UserMetrics } from "@/types";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "Please log in to generate AI insights.",
        },
        { status: 401 },
      );
    }

    const metrics = (await request.json()) as UserMetrics;
    const result = await generateFinancialInsight(metrics);

    const latestSnapshots = await Promise.all([
      supabase
        .from("spending_snapshots")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("city_snapshots")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const insertResult = await supabase.from("ai_insights").insert({
      user_id: user.id,
      spending_snapshot_id: latestSnapshots[0].data?.id ?? null,
      city_snapshot_id: latestSnapshots[1].data?.id ?? null,
      lesson_id: result.lesson.id,
      lesson_title: result.lesson.title,
      prompt: "Teen-friendly financial explanation and one practical action.",
      insight_text: result.insight,
      lesson_text: result.lesson.lessonText,
      model: process.env.OPENAI_API_KEY ? "gpt-4.1-mini" : "fallback",
    });

    if (insertResult.error) {
      throw insertResult.error;
    }

    return NextResponse.json<InsightApiResponse>({
      insight: result.insight,
      lesson: result.lesson,
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
