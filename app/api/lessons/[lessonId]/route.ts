import { NextResponse } from "next/server";

import {
  getLessonForUser,
  updateLessonCompletion,
} from "@/lib/server/lessonService";
import { getAuthenticatedUser, getErrorMessage } from "@/lib/server/transactionService";
import type { LessonDetailResponse } from "@/types";

export async function GET(
  _request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const { lessonId } = await context.params;
    const payload = await getLessonForUser(user.id, lessonId, supabase);

    if (!payload) {
      return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
    }

    return NextResponse.json<LessonDetailResponse>(payload);
  } catch (routeError) {
    return NextResponse.json(
      { error: getErrorMessage(routeError) },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const { lessonId } = await context.params;
    const body = (await request.json()) as { completed?: unknown };

    if (typeof body.completed !== "boolean") {
      return NextResponse.json(
        { error: "Please send a boolean completed value." },
        { status: 400 },
      );
    }

    const payload = await updateLessonCompletion({
      userId: user.id,
      lessonId,
      completed: body.completed,
      supabase,
    });

    if (!payload) {
      return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
    }

    return NextResponse.json<LessonDetailResponse>(payload);
  } catch (routeError) {
    return NextResponse.json(
      { error: getErrorMessage(routeError) },
      { status: 500 },
    );
  }
}
