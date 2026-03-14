import { NextResponse } from "next/server";

import {
  getLessonForUser,
  updateLessonCompletion,
} from "@/lib/server/lessonService";
import { getAuthenticatedUser } from "@/lib/server/transactionService";
import type { LessonDetailResponse } from "@/types";

export async function GET(
  _request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: error ?? "Unauthorized" }, { status: 401 });
    }

    const { lessonId } = await context.params;
    if (!lessonId || typeof lessonId !== "string" || lessonId.trim() === "") {
      return NextResponse.json({ error: "Lesson ID is required." }, { status: 400 });
    }

    const payload = await getLessonForUser(user.id, lessonId.trim(), supabase);

    if (!payload) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    return NextResponse.json<LessonDetailResponse>(payload);
  } catch (routeError) {
    const message =
      typeof routeError === "object" && routeError !== null && "message" in routeError && typeof (routeError as { message: unknown }).message === "string"
        ? (routeError as { message: string }).message
        : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: error ?? "Unauthorized" }, { status: 401 });
    }

    const { lessonId } = await context.params;
    if (!lessonId || typeof lessonId !== "string" || lessonId.trim() === "") {
      return NextResponse.json({ error: "Lesson ID is required." }, { status: 400 });
    }

    let body: { completed?: unknown };
    try {
      body = (await request.json()) as { completed?: unknown };
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    if (typeof body.completed !== "boolean") {
      return NextResponse.json(
        { error: "Please send a boolean completed value." },
        { status: 400 },
      );
    }

    const payload = await updateLessonCompletion({
      userId: user.id,
      lessonId: lessonId.trim(),
      completed: body.completed,
      supabase,
    });

    if (!payload) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    return NextResponse.json<LessonDetailResponse>(payload);
  } catch (routeError) {
    const message =
      typeof routeError === "object" && routeError !== null && "message" in routeError && typeof (routeError as { message: unknown }).message === "string"
        ? (routeError as { message: string }).message
        : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
