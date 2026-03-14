import { NextResponse } from "next/server";

import { generateLessonForUser } from "@/lib/server/lessonService";
import { getAuthenticatedUser, getErrorMessage } from "@/lib/server/transactionService";
import type { LessonGenerateResponse } from "@/types";

export async function POST() {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const payload = await generateLessonForUser({
      userId: user.id,
      supabase,
      requireNewConcept: true,
    });

    if (!payload) {
      return NextResponse.json(
        {
          error: "Add a few transactions before generating lessons.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json<LessonGenerateResponse>(payload);
  } catch (routeError) {
    return NextResponse.json(
      { error: getErrorMessage(routeError) },
      { status: 500 },
    );
  }
}
