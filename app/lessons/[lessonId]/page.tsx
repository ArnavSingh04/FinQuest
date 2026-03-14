"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";
import type { Lesson, LessonDetailResponse } from "@/types";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default function LessonDetailPage() {
  const params = useParams<{ lessonId: string }>();
  const { user, loading } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user || !params.lessonId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadLesson() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/lessons/${params.lessonId}`);

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error || "Unable to load lesson.");
        }

        const payload = (await response.json()) as LessonDetailResponse;

        if (!isMounted) {
          return;
        }

        setLesson(payload.lesson);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load lesson.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadLesson();

    return () => {
      isMounted = false;
    };
  }, [loading, params.lessonId, user]);

  async function toggleCompletion() {
    if (!lesson || isSaving) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/lessons/${lesson.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completed: !lesson.completed,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to update lesson.");
      }

      const payload = (await response.json()) as LessonDetailResponse;
      setLesson(payload.lesson);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update lesson.");
    } finally {
      setIsSaving(false);
    }
  }

  if (loading || isLoading) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-6">
        <div className="glass-card rounded-[2rem] p-6 text-slate-300">
          Loading lesson...
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-6">
        <div className="glass-card rounded-[2rem] p-6 text-slate-300">
          Log in to read personalized lessons.
        </div>
      </main>
    );
  }

  if (!lesson) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-6">
        <div className="glass-card rounded-[2rem] p-6 text-slate-300">
          {error || "Lesson not found."}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-6">
      <section className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/lessons" className="text-sm font-medium text-sky-300 transition hover:text-sky-200">
            ← Back to lessons
          </Link>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
            {lesson.concept}
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-white">{lesson.title}</h1>
          <p className="mt-3 text-sm text-slate-400">
            Generated {dateFormatter.format(new Date(lesson.createdAt))}
          </p>
        </div>

        <button
          type="button"
          onClick={toggleCompletion}
          disabled={isSaving}
          className={`rounded-2xl px-5 py-3 text-sm font-semibold transition disabled:opacity-60 ${
            lesson.completed
              ? "border border-white/10 bg-slate-900/60 text-white"
              : "bg-gradient-to-r from-sky-400 to-emerald-400 text-slate-950"
          }`}
        >
          {isSaving
            ? "Saving..."
            : lesson.completed
              ? "Mark as Incomplete"
              : "Mark as Complete"}
        </button>
      </section>

      <section className="glass-card rounded-[2rem] p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
          Explanation
        </p>
        <p className="mt-4 text-lg leading-8 text-slate-200">{lesson.explanation}</p>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="glass-card rounded-[2rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
            Your Examples
          </p>
          <div className="mt-5 space-y-3">
            {lesson.examples.map((example, index) => (
              <div
                key={`${lesson.id}-example-${index}`}
                className="rounded-[1.5rem] border border-white/10 bg-slate-950/30 p-4 text-sm leading-6 text-slate-300"
              >
                {example}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-[2rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Actionable Advice
          </p>
          <div className="mt-5 space-y-3">
            {lesson.advice.map((tip, index) => (
              <div
                key={`${lesson.id}-advice-${index}`}
                className="rounded-[1.5rem] border border-emerald-400/15 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-100"
              >
                {tip}
              </div>
            ))}
          </div>
        </div>
      </section>

      {error ? (
        <section className="glass-card mt-6 rounded-[1.5rem] p-4 text-sm text-rose-300">
          {error}
        </section>
      ) : null}
    </main>
  );
}
