import { createSupabaseServerClient } from "@/lib/auth-server";
import { generatePersonalizedLesson } from "@/lib/aiLessons";
import {
  getAllLessonTriggers,
  getLessonTriggerDefinition,
  getPrimaryLessonTrigger,
  getTriggeredLessonTriggers,
} from "@/lib/lessonTriggers";
import { buildUserMetrics } from "@/lib/playerState";
import type {
  Lesson,
  LessonDetailResponse,
  LessonGenerateResponse,
  LessonsListResponse,
  Transaction,
} from "@/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type LessonRow = {
  id: string;
  trigger_id: string;
  title: string;
  concept: string;
  preview_text: string;
  explanation: string;
  examples: unknown;
  advice: unknown;
  created_at: string;
  completed: boolean;
  generated_by: string;
};

function normalizeTransactions(rows: Transaction[]) {
  return rows.map((transaction) => ({
    ...transaction,
    amount: Number(transaction.amount),
  }));
}

function normalizeTextArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function mapLessonRow(row: LessonRow): Lesson {
  return {
    id: row.id,
    triggerId: row.trigger_id,
    title: row.title,
    concept: row.concept,
    previewText: row.preview_text,
    explanation: row.explanation,
    examples: normalizeTextArray(row.examples),
    advice: normalizeTextArray(row.advice),
    createdAt: row.created_at,
    completed: Boolean(row.completed),
    generatedBy: row.generated_by,
  };
}

async function getRecentTransactions(userId: string, supabase: SupabaseServerClient) {
  const result = await supabase
    .from("transactions")
    .select(
      "id, user_id, amount, category, merchant_name, note, source, spent_at, created_at, updated_at",
    )
    .eq("user_id", userId)
    .order("spent_at", { ascending: false });

  if (result.error) {
    throw result.error;
  }

  return normalizeTransactions((result.data ?? []) as Transaction[]);
}

async function getLatestSnapshotIds(userId: string, supabase: SupabaseServerClient) {
  const [latestSpendingSnapshot, latestCitySnapshot] = await Promise.all([
    supabase
      .from("spending_snapshots")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("city_snapshots")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (latestSpendingSnapshot.error) {
    throw latestSpendingSnapshot.error;
  }

  if (latestCitySnapshot.error) {
    throw latestCitySnapshot.error;
  }

  return {
    spendingSnapshotId: latestSpendingSnapshot.data?.id ?? null,
    citySnapshotId: latestCitySnapshot.data?.id ?? null,
  };
}

async function findReusableLesson(params: {
  userId: string;
  triggerId: string;
  dedupeWindowDays: number;
  supabase: SupabaseServerClient;
}) {
  const { userId, triggerId, dedupeWindowDays, supabase } = params;
  const since = new Date(Date.now() - dedupeWindowDays * 24 * 60 * 60 * 1000).toISOString();

  const result = await supabase
    .from("lessons")
    .select(
      "id, trigger_id, title, concept, preview_text, explanation, examples, advice, created_at, completed, generated_by",
    )
    .eq("user_id", userId)
    .eq("trigger_id", triggerId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return result.data ? mapLessonRow(result.data as LessonRow) : null;
}

async function getExistingLessonTriggerIds(
  userId: string,
  supabase: SupabaseServerClient,
) {
  const result = await supabase
    .from("lessons")
    .select("trigger_id")
    .eq("user_id", userId);

  if (result.error) {
    throw result.error;
  }

  return new Set(
    (result.data ?? [])
      .map((row) => row.trigger_id)
      .filter((triggerId): triggerId is string => typeof triggerId === "string"),
  );
}

export async function listLessonsForUser(
  userId: string,
  supabase: SupabaseServerClient,
): Promise<LessonsListResponse> {
  const result = await supabase
    .from("lessons")
    .select(
      "id, trigger_id, title, concept, preview_text, explanation, examples, advice, created_at, completed, generated_by",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (result.error) {
    throw result.error;
  }

  return {
    lessons: ((result.data ?? []) as LessonRow[]).map(mapLessonRow),
  };
}

export async function ensureInitialLessonsForUser(params: {
  userId: string;
  supabase: SupabaseServerClient;
  minimumCount?: number;
}) {
  const { userId, supabase, minimumCount = 5 } = params;

  try {
    const existingLessons = await listLessonsForUser(userId, supabase);
    let currentCount = existingLessons.lessons.length;

    if (currentCount >= minimumCount) {
      return;
    }

    for (let attempt = currentCount; attempt < minimumCount; attempt += 1) {
      const generatedLesson = await generateLessonForUser({
        userId,
        supabase,
        requireNewConcept: true,
      });

      if (!generatedLesson) {
        break;
      }

      currentCount += 1;
    }
  } catch {
    // Lessons are educational enhancements, so bootstrap failures should not block page loads.
  }
}

export async function getLessonForUser(
  userId: string,
  lessonId: string,
  supabase: SupabaseServerClient,
): Promise<LessonDetailResponse | null> {
  const result = await supabase
    .from("lessons")
    .select(
      "id, trigger_id, title, concept, preview_text, explanation, examples, advice, created_at, completed, generated_by",
    )
    .eq("user_id", userId)
    .eq("id", lessonId)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return result.data ? { lesson: mapLessonRow(result.data as LessonRow) } : null;
}

export async function updateLessonCompletion(params: {
  userId: string;
  lessonId: string;
  completed: boolean;
  supabase: SupabaseServerClient;
}): Promise<LessonDetailResponse | null> {
  const { userId, lessonId, completed, supabase } = params;

  const result = await supabase
    .from("lessons")
    .update({ completed })
    .eq("user_id", userId)
    .eq("id", lessonId)
    .select(
      "id, trigger_id, title, concept, preview_text, explanation, examples, advice, created_at, completed, generated_by",
    )
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return result.data ? { lesson: mapLessonRow(result.data as LessonRow) } : null;
}

export async function generateLessonForUser(params: {
  userId: string;
  supabase: SupabaseServerClient;
  requireNewConcept?: boolean;
}): Promise<LessonGenerateResponse | null> {
  const { userId, supabase, requireNewConcept = false } = params;
  const transactions = await getRecentTransactions(userId, supabase);

  if (transactions.length === 0) {
    return null;
  }

  const metrics = buildUserMetrics(transactions);
  const trigger = requireNewConcept
    ? (
        await (async () => {
          const existingTriggerIds = await getExistingLessonTriggerIds(userId, supabase);
          const unseenTriggeredTrigger =
            getTriggeredLessonTriggers(metrics).find(
              (candidate) => !existingTriggerIds.has(candidate.id),
            ) ?? null;

          if (unseenTriggeredTrigger) {
            return unseenTriggeredTrigger;
          }

          return (
            getAllLessonTriggers(metrics).find(
              (candidate) => !existingTriggerIds.has(candidate.id),
            ) ?? null
          );
        })()
      )
    : getPrimaryLessonTrigger(metrics);

  if (!trigger) {
    if (requireNewConcept) {
      const allConcepts = getAllLessonTriggers(metrics);

      if (allConcepts.length > 0) {
        const leastRecentResult = await supabase
          .from("lessons")
          .select("trigger_id, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (leastRecentResult.error) {
          throw leastRecentResult.error;
        }

        const fallbackTrigger =
          allConcepts.find(
            (candidate) => candidate.id === leastRecentResult.data?.trigger_id,
          ) ?? allConcepts[0];

        if (fallbackTrigger) {
          const latestSnapshotIds = await getLatestSnapshotIds(userId, supabase);
          const generatedLesson = await generatePersonalizedLesson({
            trigger: fallbackTrigger,
            userMetrics: metrics,
            recentTransactions: transactions.slice(0, 8),
          });

          const insertResult = await supabase
            .from("lessons")
            .insert({
              user_id: userId,
              spending_snapshot_id: latestSnapshotIds.spendingSnapshotId,
              city_snapshot_id: latestSnapshotIds.citySnapshotId,
              trigger_id: fallbackTrigger.id,
              trigger_version: "v1",
              title: generatedLesson.title,
              concept: generatedLesson.concept,
              preview_text: generatedLesson.previewText,
              explanation: generatedLesson.explanation,
              examples: generatedLesson.examples,
              advice: generatedLesson.advice,
              source_metrics: metrics,
              source_transaction_ids: transactions
                .slice(0, 8)
                .map((transaction) => transaction.id)
                .filter(Boolean),
              generated_by: generatedLesson.generatedBy,
            })
            .select(
              "id, trigger_id, title, concept, preview_text, explanation, examples, advice, created_at, completed, generated_by",
            )
            .single();

          if (insertResult.error) {
            throw insertResult.error;
          }

          return {
            lesson: mapLessonRow(insertResult.data as LessonRow),
            created: true,
            reused: false,
          };
        }
      }

      throw new Error("Unable to generate a lesson right now.");
    }

    return null;
  }

  if (!requireNewConcept) {
    const triggerDefinition = getLessonTriggerDefinition(trigger.id);
    const reusableLesson = await findReusableLesson({
      userId,
      triggerId: trigger.id,
      dedupeWindowDays: triggerDefinition?.dedupeWindowDays ?? 7,
      supabase,
    });

    if (reusableLesson) {
      return {
        lesson: reusableLesson,
        created: false,
        reused: true,
      };
    }
  }

  const latestSnapshotIds = await getLatestSnapshotIds(userId, supabase);
  const generatedLesson = await generatePersonalizedLesson({
    trigger,
    userMetrics: metrics,
    recentTransactions: transactions.slice(0, 8),
  });

  const insertResult = await supabase
    .from("lessons")
    .insert({
      user_id: userId,
      spending_snapshot_id: latestSnapshotIds.spendingSnapshotId,
      city_snapshot_id: latestSnapshotIds.citySnapshotId,
      trigger_id: trigger.id,
      trigger_version: "v1",
      title: generatedLesson.title,
      concept: generatedLesson.concept,
      preview_text: generatedLesson.previewText,
      explanation: generatedLesson.explanation,
      examples: generatedLesson.examples,
      advice: generatedLesson.advice,
      source_metrics: metrics,
      source_transaction_ids: transactions
        .slice(0, 8)
        .map((transaction) => transaction.id)
        .filter(Boolean),
      generated_by: generatedLesson.generatedBy,
    })
    .select(
      "id, trigger_id, title, concept, preview_text, explanation, examples, advice, created_at, completed, generated_by",
    )
    .single();

  if (insertResult.error) {
    throw insertResult.error;
  }

  return {
    lesson: mapLessonRow(insertResult.data as LessonRow),
    created: true,
    reused: false,
  };
}

export async function ensureLessonForUser(
  userId: string,
  supabase: SupabaseServerClient,
) {
  try {
    await generateLessonForUser({ userId, supabase, requireNewConcept: false });
  } catch {
    // Lessons are educational enhancements, so generation failures should not block page loads.
  }
}
