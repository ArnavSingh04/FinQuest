import { NextResponse } from "next/server";

import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const adminSupabase = createSupabaseAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Login required." }, { status: 401 });
    }

    const body = (await request.json()) as { inviteCode?: string };
    const inviteCode = body.inviteCode?.trim().toUpperCase();

    if (!inviteCode) {
      return NextResponse.json(
        { error: "Invite code is required." },
        { status: 400 },
      );
    }

    // Invite lookups must bypass member-only group read policies.
    const groupResult = await adminSupabase
      .from("groups")
      .select("id, name, invite_code, owner_id, created_at")
      .eq("invite_code", inviteCode)
      .maybeSingle();

    if (groupResult.error) {
      throw groupResult.error;
    }

    if (!groupResult.data) {
      return NextResponse.json(
        { error: "Group not found for that invite code." },
        { status: 404 },
      );
    }

    const membershipResult = await supabase.from("group_members").upsert(
      {
        group_id: groupResult.data.id,
        user_id: user.id,
        role: groupResult.data.owner_id === user.id ? "owner" : "member",
      },
      {
        onConflict: "group_id,user_id",
        ignoreDuplicates: true,
      },
    );

    if (membershipResult.error) {
      throw membershipResult.error;
    }

    return NextResponse.json({ group: groupResult.data });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to join group.",
      },
      { status: 500 },
    );
  }
}
