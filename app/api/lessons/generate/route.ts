import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/auth-server";
import { generatePersonalizedLesson } from "@/lib/personalizedLessons";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please log in to generate lessons." },
        { status: 401 },
      );
    }

    // Generate personalized lesson
    const lesson = await generatePersonalizedLesson(user.id);

    if (!lesson) {
      return NextResponse.json(
        {
          error: "You need at least 2 transactions with detectable patterns to generate personalized lessons. Keep logging your spending!",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      lesson: lesson,
      message: "Personalized lesson generated successfully!",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to generate lesson.";

    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
