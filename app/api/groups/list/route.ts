import { NextResponse } from "next/server";

import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/auth-server";
import type {
  Group,
  GroupLeaderboardEntry,
  GroupMemberSummary,
  GroupSummary,
} from "@/types";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const adminSupabase = createSupabaseAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Login required." }, { status: 401 });
    }

    const membershipResult = await supabase
      .from("group_members")
      .select("group_id, groups(id, name, invite_code, owner_id, created_at)")
      .eq("user_id", user.id);

    if (membershipResult.error) {
      throw membershipResult.error;
    }

    const groups = (membershipResult.data ?? [])
      .map((record) => {
        const group = Array.isArray(record.groups)
          ? record.groups[0]
          : record.groups;

        return group
          ? {
              id: group.id,
              name: group.name,
              invite_code: group.invite_code,
              owner_id: group.owner_id,
              created_at: group.created_at,
            }
          : null;
      })
      .filter((group): group is Group => Boolean(group));

    if (groups.length === 0) {
      return NextResponse.json({ groups: [] });
    }

    const groupIds = groups.map((group) => group.id);

    const membersResult = await adminSupabase
      .from("group_members")
      .select("group_id, user_id, role, joined_at, profiles(username, full_name)")
      .in("group_id", groupIds)
      .order("joined_at", { ascending: true });

    if (membersResult.error) {
      throw membersResult.error;
    }

    const userIds = Array.from(
      new Set((membersResult.data ?? []).map((member) => member.user_id)),
    );

    const [progressResult, cityResult] = await Promise.all([
      adminSupabase
        .from("user_progress")
        .select("user_id, total_xp, level")
        .in("user_id", userIds),
      adminSupabase
        .from("city_snapshots")
        .select("user_id, growth, created_at")
        .in("user_id", userIds)
        .order("created_at", { ascending: false }),
    ]);

    if (progressResult.error) {
      throw progressResult.error;
    }

    if (cityResult.error) {
      throw cityResult.error;
    }

    const progressByUser = new Map(
      (progressResult.data ?? []).map((progress) => [
        progress.user_id,
        {
          xp: progress.total_xp,
          level: progress.level,
        },
      ]),
    );

    const latestGrowthByUser = new Map<string, number>();

    for (const city of cityResult.data ?? []) {
      if (!latestGrowthByUser.has(city.user_id)) {
        latestGrowthByUser.set(city.user_id, city.growth);
      }
    }

    const groupsWithLeaderboard: GroupSummary[] = groups.map((group) => {
      const members = (membersResult.data ?? []).filter(
        (member) => member.group_id === group.id,
      );

      const detailedMembers = members
        .map((member) => {
          const progress = progressByUser.get(member.user_id);
          const profile = Array.isArray(member.profiles)
            ? member.profiles[0]
            : member.profiles;
          const username =
            profile?.username || profile?.full_name || "Anonymous Mayor";

          return {
            userId: member.user_id,
            username,
            role: member.role,
            joinedAt: member.joined_at,
            xp: progress?.xp ?? 0,
            level: progress?.level ?? 1,
            cityGrowth: latestGrowthByUser.get(member.user_id) ?? 0,
          };
        })
        .sort((a, b) => {
          if (a.role !== b.role) {
            return a.role === "owner" ? -1 : 1;
          }

          return a.username.localeCompare(b.username);
        });

      const leaderboard: GroupLeaderboardEntry[] = detailedMembers
        .map((member) => {
          return {
            userId: member.userId,
            username: member.username,
            xp: member.xp,
            level: member.level,
            cityGrowth: member.cityGrowth,
          };
        })
        .sort((a, b) => b.xp - a.xp);

      const memberSummaries: GroupMemberSummary[] = detailedMembers.map(
        ({ userId, username, role, joinedAt }) => ({
          userId,
          username,
          role,
          joinedAt,
        }),
      );

      return {
        ...group,
        memberCount: members.length,
        members: memberSummaries,
        leaderboard,
      };
    });

    return NextResponse.json({ groups: groupsWithLeaderboard });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to list groups.",
      },
      { status: 500 },
    );
  }
}
