import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/auth-server";
import { ensureLessonForUser } from "@/lib/server/lessonService";
import { buildDashboardPayload } from "@/lib/playerState";
import type {
  AIInsightPayload,
  DashboardPayload,
  Transaction,
  TransactionCategory,
} from "@/types";

export type QuickLogAmountBucket =
  | "under-10"
  | "10-20"
  | "20-50"
  | "50-100"
  | "100-200"
  | "over-200";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export const validTransactionCategories: TransactionCategory[] = [
  "Need",
  "Want",
  "Treat",
  "Invest",
];

export const validQuickLogAmountBuckets: QuickLogAmountBucket[] = [
  "under-10",
  "10-20",
  "20-50",
  "50-100",
  "100-200",
  "over-200",
];

const quickLogAmountMap: Record<QuickLogAmountBucket, number> = {
  "under-10": 5,
  "10-20": 15,
  "20-50": 35,
  "50-100": 75,
  "100-200": 150,
  "over-200": 250,
};

export function getErrorMessage(error: unknown) {
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

export async function getAuthenticatedUser() {
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

async function getLatestInsight(userId: string, supabase: SupabaseServerClient) {
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

export async function buildResponseForUser(
  userId: string,
  supabase: SupabaseServerClient,
) {
  const transactionResult = await supabase
    .from("transactions")
    .select(
      "id, user_id, amount, category, merchant_name, note, source, spent_at, created_at, updated_at",
    )
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

export async function persistDerivedState(params: {
  supabase: SupabaseServerClient;
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
      payload.progress.achievements.find((achievement) => achievement.unlocked)?.id ?? null,
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

export async function createTransaction(params: {
  supabase: SupabaseServerClient;
  userId: string;
  amount: number;
  category: TransactionCategory;
  merchant_name?: string | null;
  note?: string | null;
  source?: string | null;
}) {
  const { supabase, userId, amount, category, merchant_name, note, source } = params;

  const insertResult = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      amount,
      category,
      merchant_name: merchant_name ?? null,
      note: note ?? null,
      source: source ?? "manual",
    })
    .select("id")
    .single();

  if (insertResult.error) {
    throw insertResult.error;
  }

  const payload = await buildResponseForUser(userId, supabase);
  await persistDerivedState({
    supabase,
    userId,
    transactionId: insertResult.data.id,
    payload,
  });
  await ensureLessonForUser(userId, supabase);

  return payload;
}

export function resolveQuickLogAmount(bucket: QuickLogAmountBucket) {
  return quickLogAmountMap[bucket];
}

export function isQuickLogAmountBucket(value: string): value is QuickLogAmountBucket {
  return validQuickLogAmountBuckets.includes(value as QuickLogAmountBucket);
}

export async function createQuickLogTransaction(params: {
  supabase: SupabaseServerClient;
  userId: string;
  amountBucket: QuickLogAmountBucket;
  category: TransactionCategory;
}) {
  const { supabase, userId, amountBucket, category } = params;

  return createTransaction({
    supabase,
    userId,
    amount: resolveQuickLogAmount(amountBucket),
    category,
    source: "quick-log",
    note: `Quick log bucket: ${amountBucket}`,
  });
}

export async function resetUserData(userId: string) {
  const adminSupabase = createSupabaseAdminClient();

  const [
    lessonDeleteResult,
    insightDeleteResult,
    achievementDeleteResult,
    cityDeleteResult,
    spendingDeleteResult,
    transactionDeleteResult,
  ] = await Promise.all([
    adminSupabase.from("lessons").delete().eq("user_id", userId),
    adminSupabase.from("ai_insights").delete().eq("user_id", userId),
    adminSupabase.from("user_achievements").delete().eq("user_id", userId),
    adminSupabase.from("city_snapshots").delete().eq("user_id", userId),
    adminSupabase.from("spending_snapshots").delete().eq("user_id", userId),
    adminSupabase.from("transactions").delete().eq("user_id", userId),
  ]);

  if (lessonDeleteResult.error) {
    throw lessonDeleteResult.error;
  }

  if (insightDeleteResult.error) {
    throw insightDeleteResult.error;
  }

  if (achievementDeleteResult.error) {
    throw achievementDeleteResult.error;
  }

  if (cityDeleteResult.error) {
    throw cityDeleteResult.error;
  }

  if (spendingDeleteResult.error) {
    throw spendingDeleteResult.error;
  }

  if (transactionDeleteResult.error) {
    throw transactionDeleteResult.error;
  }

  const resetPayload = buildDashboardPayload({
    transactions: [],
    latestInsight: null,
  });

  const progressResetResult = await adminSupabase.from("user_progress").upsert({
    user_id: userId,
    total_xp: resetPayload.progress.xp,
    level: resetPayload.progress.level,
    last_achievement_id: null,
  });

  if (progressResetResult.error) {
    throw progressResetResult.error;
  }

  return resetPayload;
}
