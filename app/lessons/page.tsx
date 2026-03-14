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

function LessonCard({ lesson }: { lesson: Lesson }) {
  return (
    <Link
      href={`/lessons/${lesson.id}`}
      className="glass-card block rounded-[1.75rem] p-5 transition hover:border-white/20 hover:bg-white/[0.04]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-300">
            {lesson.concept}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{lesson.title}</h2>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
            lesson.completed
              ? "bg-emerald-400/15 text-emerald-200"
              : "bg-amber-400/15 text-amber-200"
          }`}
        >
          {lesson.completed ? "Completed" : "New"}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-300">{lesson.previewText}</p>
      <p className="mt-5 text-xs uppercase tracking-[0.16em] text-slate-500">
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
      <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-6">
        <div className="glass-card rounded-[2rem] p-6 text-slate-300">
          Loading lessons...
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-4xl px-5 py-6">
        <div className="glass-card rounded-[2rem] p-6 text-slate-300">
          Log in to unlock personalized lessons based on your spending.
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-6">
      <section className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
            FinQuest Academy
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-white">Lessons</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Short financial lessons generated from your real spending patterns so you
            can learn from what your money is already doing.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerateLesson}
          disabled={isGenerating}
          className="rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition disabled:opacity-60"
        >
          {isGenerating ? "Generating..." : "Generate New Lesson"}
        </button>
      </section>

      {feedback ? (
        <section className="glass-card mb-6 rounded-[1.5rem] p-4 text-sm text-emerald-200">
          {feedback}
        </section>
      ) : null}

      {error ? (
        <section className="glass-card mb-6 rounded-[1.5rem] p-4 text-sm text-rose-300">
          {error}
        </section>
      ) : null}

      {lessons.length === 0 ? (
        <section className="glass-card rounded-[2rem] p-6">
          <h2 className="text-2xl font-semibold text-white">No lessons yet</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Log a few transactions first, then FinQuest will turn those money habits
            into personalized micro lessons.
          </p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </section>
      )}
    </main>
  );
}
