import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/auth-server";

function buildInviteCode() {
  return randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Login required." }, { status: 401 });
    }

    const body = (await request.json()) as { name?: string };
    const name = body.name?.trim();

    if (!name) {
      return NextResponse.json(
        { error: "Group name is required." },
        { status: 400 },
      );
    }

    const groupResult = await supabase
      .from("groups")
      .insert({
        name,
        invite_code: buildInviteCode(),
        owner_id: user.id,
      })
      .select("id, name, invite_code, owner_id, created_at")
      .single();

    if (groupResult.error) {
      throw groupResult.error;
    }

    const memberResult = await supabase.from("group_members").insert({
      group_id: groupResult.data.id,
      user_id: user.id,
      role: "owner",
    });

    if (memberResult.error) {
      throw memberResult.error;
    }

    return NextResponse.json({ group: groupResult.data });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create group.",
      },
      { status: 500 },
    );
  }
}
