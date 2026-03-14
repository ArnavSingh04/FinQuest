import { NextResponse } from "next/server";

import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/auth-server";
import { buildDashboardPayload } from "@/lib/playerState";
import type {
  AIInsightPayload,
  GroupMemberProfileResponse,
  Transaction,
} from "@/types";

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

  return "Unable to load group member.";
}

function normalizeTransactions(rows: Transaction[]) {
  return rows.map((transaction) => ({
    ...transaction,
    amount: Number(transaction.amount),
  }));
}

async function getLatestInsight(
  userId: string,
  supabase: ReturnType<typeof createSupabaseAdminClient>,
) {
  const { data, error } = await supabase
    .from("ai_insights")
    .select("lesson_id, lesson_title, insight_text, lesson_text")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ groupId: string; memberId: string }> },
) {
  try {
    const supabase = await createSupabaseServerClient();
    const adminSupabase = createSupabaseAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Login required." }, { status: 401 });
    }

    const { groupId, memberId } = await params;

    const viewerMembershipResult = await supabase
      .from("group_members")
      .select("group_id")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (viewerMembershipResult.error) {
      throw viewerMembershipResult.error;
    }

    if (!viewerMembershipResult.data) {
      return NextResponse.json(
        { error: "You do not have access to this group." },
        { status: 403 },
      );
    }

    const memberResult = await adminSupabase
      .from("group_members")
      .select("user_id, role, joined_at, groups(name), profiles(username, full_name)")
      .eq("group_id", groupId)
      .eq("user_id", memberId)
      .maybeSingle();

    if (memberResult.error) {
      throw memberResult.error;
    }

    if (!memberResult.data) {
      return NextResponse.json(
        { error: "That member is not in this group." },
        { status: 404 },
      );
    }

    const transactionResult = await adminSupabase
      .from("transactions")
      .select(
        "id, user_id, amount, category, merchant_name, note, source, spent_at, created_at, updated_at",
      )
      .eq("user_id", memberId)
      .order("spent_at", { ascending: false });

    if (transactionResult.error) {
      throw transactionResult.error;
    }

    const latestInsight = await getLatestInsight(memberId, adminSupabase);
    const transactions = normalizeTransactions(
      (transactionResult.data ?? []) as Transaction[],
    );
    const group = Array.isArray(memberResult.data.groups)
      ? memberResult.data.groups[0]
      : memberResult.data.groups;
    const profile = Array.isArray(memberResult.data.profiles)
      ? memberResult.data.profiles[0]
      : memberResult.data.profiles;

    const payload: GroupMemberProfileResponse = {
      group: {
        id: groupId,
        name: group?.name ?? "Group",
      },
      member: {
        userId: memberResult.data.user_id,
        username: profile?.username || profile?.full_name || "Anonymous Mayor",
        role: memberResult.data.role,
        joinedAt: memberResult.data.joined_at,
      },
      dashboard: buildDashboardPayload({
        transactions,
        latestInsight,
      }),
    };

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
