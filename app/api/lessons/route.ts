import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/auth-server";
import { getUserLessons } from "@/lib/personalizedLessons";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please log in to view your lessons." },
        { status: 401 },
      );
    }

    // Fetch user's lessons using the helper function
    const lessons = await getUserLessons(user.id, 20);

    // Remove duplicates based on lesson_title and created_at (keep most recent)
    const uniqueLessons = Array.from(
      new Map(
        (lessons || []).map((lesson) => [
          `${lesson.lesson_title}-${new Date(lesson.created_at).toDateString()}`,
          lesson,
        ]),
      ).values(),
    ).sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return NextResponse.json({
      lessons: uniqueLessons,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load lessons.";

    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
