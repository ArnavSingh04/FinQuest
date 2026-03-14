import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/auth-server";
import { buildDashboardPayload } from "@/lib/playerState";
import { generatePersonalizedLesson } from "@/lib/personalizedLessons";
import type {
  AIInsightPayload,
  DashboardPayload,
  Transaction,
  TransactionCategory,
} from "@/types";

const validCategories: TransactionCategory[] = [
  "Need",
  "Want",
  "Treat",
  "Invest",
];

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Failed to process transaction.";
}

async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      supabase,
      user: null,
      error: error?.message || "Please log in to save transactions.",
    };
  }

  return {
    supabase,
    user,
    error: null,
  };
}

function normalizeTransactions(rows: Transaction[]) {
  return rows.map((transaction) => ({
    ...transaction,
    amount: Number(transaction.amount),
  }));
}

async function getLatestInsight(
  userId: string,
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
) {
  const { data } = await supabase
    .from("ai_insights")
    .select("lesson_id, lesson_title, insight_text, lesson_text")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return {
    insight: data.insight_text,
    lesson: {
      id: data.lesson_id ?? "money-basics",
      title: data.lesson_title ?? "Money Basics",
      description: "Latest stored lesson for this user.",
      lessonText: data.lesson_text,
    },
  } satisfies AIInsightPayload;
}

async function buildResponseForUser(
  userId: string,
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
) {
  const transactionResult = await supabase
    .from("transactions")
    .select("id, user_id, amount, category, merchant_name, note, source, spent_at, created_at, updated_at")
    .eq("user_id", userId)
    .order("spent_at", { ascending: false });

  if (transactionResult.error) {
    throw transactionResult.error;
  }

  const transactions = normalizeTransactions((transactionResult.data ?? []) as Transaction[]);
  const latestInsight = await getLatestInsight(userId, supabase);

  return buildDashboardPayload({
    transactions,
    latestInsight,
  });
}

async function persistDerivedState(params: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  userId: string;
  transactionId?: string;
  payload: DashboardPayload;
}) {
  const { supabase, userId, transactionId, payload } = params;

  const spendingSnapshotResult = await supabase
    .from("spending_snapshots")
    .insert({
      user_id: userId,
      transaction_id: transactionId ?? null,
      needs_ratio: payload.ratios.needs_ratio,
      wants_ratio: payload.ratios.wants_ratio,
      treat_ratio: payload.ratios.treat_ratio,
      invest_ratio: payload.ratios.invest_ratio,
      transaction_count: payload.transactionCount,
      total_spent: payload.totalSpent,
      liquidity_score: payload.scores.liquidity,
      budget_health: payload.scores.budgetHealth,
      investment_growth: payload.scores.investmentGrowth,
      stability: payload.scores.stability,
      economy_score: payload.scores.economyScore,
    })
    .select("id")
    .single();

  if (spendingSnapshotResult.error) {
    throw spendingSnapshotResult.error;
  }

  const citySnapshotResult = await supabase.from("city_snapshots").insert({
    user_id: userId,
    spending_snapshot_id: spendingSnapshotResult.data.id,
    economy_score: payload.cityMetrics.economyScore,
    pollution: payload.cityMetrics.pollution,
    infrastructure: payload.cityMetrics.infrastructure,
    growth: payload.cityMetrics.growth,
    liquidity: payload.cityMetrics.liquidity,
    stability: payload.cityMetrics.stability,
    entertainment: payload.cityMetrics.entertainment,
    parks: payload.cityMetrics.parks,
    emergency_warning: payload.cityMetrics.emergencyWarning,
  });

  if (citySnapshotResult.error) {
    throw citySnapshotResult.error;
  }

  const progressResult = await supabase.from("user_progress").upsert({
    user_id: userId,
    total_xp: payload.progress.xp,
    level: payload.progress.level,
    last_achievement_id:
      payload.progress.achievements.find((achievement) => achievement.unlocked)?.id ??
      null,
  });

  if (progressResult.error) {
    throw progressResult.error;
  }

  const unlockedAchievements = payload.progress.achievements
    .filter((achievement) => achievement.unlocked)
    .map((achievement) => ({
      user_id: userId,
      achievement_id: achievement.id,
      achievement_title: achievement.title,
      xp_reward: achievement.xpReward,
    }));

  if (unlockedAchievements.length > 0) {
    const achievementResult = await supabase
      .from("user_achievements")
      .upsert(unlockedAchievements, {
        onConflict: "user_id,achievement_id",
        ignoreDuplicates: true,
      });

    if (achievementResult.error) {
      throw achievementResult.error;
    }
  }
}

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

    if (!amount || amount <= 0 || !category || !validCategories.includes(category)) {
      return NextResponse.json(
        {
          error: "Please send a positive amount and a valid category.",
        },
        { status: 400 },
      );
    }

    const insertResult = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        amount,
        category,
        merchant_name: body.merchant_name ?? null,
        note: body.note ?? null,
        source: body.source ?? "manual",
      })
      .select("id")
      .single();

    if (insertResult.error) {
      throw insertResult.error;
    }

    const payload = await buildResponseForUser(user.id, supabase);
    await persistDerivedState({
      supabase,
      userId: user.id,
      transactionId: insertResult.data.id,
      payload,
    });

    // Auto-generate personalized lesson (async, don't block response)
    generatePersonalizedLesson(user.id)
      .then((lesson) => {
        if (lesson) {
          console.log("Personalized lesson generated successfully");
        }
      })
      .catch((lessonError) => {
        // Don't fail transaction if lesson generation fails
        console.error("Lesson generation failed:", lessonError);
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
