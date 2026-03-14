import { NextResponse } from "next/server";

import {
  ensureInitialLessonsForUser,
  listLessonsForUser,
} from "@/lib/server/lessonService";
import { getAuthenticatedUser, getErrorMessage } from "@/lib/server/transactionService";
import type { LessonsListResponse } from "@/types";

export async function GET() {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error }, { status: 401 });
    }

    await ensureInitialLessonsForUser({
      userId: user.id,
      supabase,
      minimumCount: 5,
    });
    const payload = await listLessonsForUser(user.id, supabase);

    return NextResponse.json<LessonsListResponse>(payload);
  } catch (routeError) {
    return NextResponse.json(
      { error: getErrorMessage(routeError) },
      { status: 500 },
    );
  }
}
