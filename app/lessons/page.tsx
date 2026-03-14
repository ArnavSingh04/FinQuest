"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useAuth } from "@/hooks/useAuth";
import type { Lesson, LessonGenerateResponse, LessonsListResponse } from "@/types";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const CAT_COLORS: Record<string, string> = {
  Need: "bg-[#3B7DD8]/15 text-[#3B7DD8]",
  Want: "bg-[#E8A020]/15 text-[#E8A020]",
  Treat: "bg-[#D94F3D]/15 text-[#D94F3D]",
  Invest: "bg-[#3DAB6A]/15 text-[#3DAB6A]",
};

function LessonCard({ lesson }: { lesson: Lesson }) {
  const catClass = CAT_COLORS[lesson.concept] ?? "bg-[#1C3A2E]/10 text-[#1C3A2E]";

  return (
    <Link
      href={`/lessons/${lesson.id}`}
      className="block rounded-2xl border p-5 transition hover:border-[#C8BFA8]"
      style={{ background: "#FFFFFF", borderColor: "#C8BFA8" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${catClass}`}>
            {lesson.concept}
          </span>
          <h2 className="mt-2 font-heading text-2xl font-normal" style={{ color: "#1C3A2E" }}>
            {lesson.title}
          </h2>
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
          style={
            lesson.completed
              ? { background: "#E8F7EE", color: "#3DAB6A" }
              : { background: "#E8E0D0", color: "#1C3A2E" }
          }
        >
          {lesson.completed ? "Completed" : "New"}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6" style={{ color: "#4A6358" }}>
        {lesson.previewText}
      </p>
      <p className="mt-5 text-xs uppercase tracking-[0.08em]" style={{ color: "#8A9E94" }}>
        {dateFormatter.format(new Date(lesson.createdAt))}
      </p>
    </Link>
  );
}

export default function LessonsPage() {
  const { user, loading } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function loadLessons() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/lessons");

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to load lessons.");
      }

      const payload = (await response.json()) as LessonsListResponse;
      setLessons(payload.lessons);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load lessons.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      setIsLoading(false);
      return;
    }

    void loadLessons();
  }, [loading, user]);

  async function handleGenerateLesson() {
    setIsGenerating(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch("/api/lessons/generate", {
        method: "POST",
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to generate lesson.");
      }

      const payload = (await response.json()) as LessonGenerateResponse;
      setFeedback("A new personalized lesson is ready.");
      await loadLessons();
    } catch (generateError) {
      setError(
        generateError instanceof Error
          ? generateError.message
          : "Unable to generate lesson.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  if (loading || isLoading) {
    return (
      <main className="min-h-screen w-full px-5 py-6" style={{ background: "var(--bg-base)" }}>
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border p-6" style={{ background: "#E8E0D0", borderColor: "#C8BFA8", color: "#4A6358" }}>
            Loading lessons...
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen w-full px-5 py-6" style={{ background: "var(--bg-base)" }}>
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border p-6" style={{ background: "#E8E0D0", borderColor: "#C8BFA8", color: "#4A6358" }}>
            Log in to unlock personalized lessons based on your spending.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full px-5 py-6" style={{ background: "var(--bg-base)" }}>
      <div className="mx-auto max-w-6xl">
        <section className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "#8A9E94", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>
              FinQuest Academy
            </p>
            <h1 className="mt-2 font-heading text-4xl font-normal" style={{ color: "#1C3A2E" }}>
              Lessons
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6" style={{ color: "#4A6358" }}>
              Short financial lessons generated from your real spending patterns so you
              can learn from what your money is already doing.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerateLesson}
            disabled={isGenerating}
            className="rounded-full px-5 py-3 text-sm font-semibold text-white transition disabled:opacity-60"
            style={{ background: "#C17B3F" }}
          >
            {isGenerating ? "Generating..." : "Generate New Lesson"}
          </button>
        </section>

        {feedback ? (
          <section className="mb-6 rounded-2xl border p-4 text-sm" style={{ background: "#E8F7EE", borderColor: "#C8BFA8", color: "#1C3A2E" }}>
            {feedback}
          </section>
        ) : null}

        {error ? (
          <section className="mb-6 rounded-2xl border p-4 text-sm" style={{ background: "#FFFFFF", borderColor: "#D94F3D", color: "#D94F3D" }}>
            {error}
          </section>
        ) : null}

        {lessons.length === 0 ? (
          <section className="rounded-2xl border p-6" style={{ background: "#FFFFFF", borderColor: "#C8BFA8" }}>
            <h2 className="font-heading text-2xl font-normal" style={{ color: "#1C3A2E" }}>
              No lessons yet
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6" style={{ color: "#4A6358" }}>
              Log a few transactions first, then FinQuest will turn those money habits
              into personalized micro lessons.
            </p>
            <button
              type="button"
              onClick={handleGenerateLesson}
              disabled={isGenerating}
              className="mt-4 rounded-full px-5 py-3 text-sm font-semibold text-white transition disabled:opacity-60"
              style={{ background: "#C17B3F" }}
            >
              Generate New Lesson
            </button>
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {lessons.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
