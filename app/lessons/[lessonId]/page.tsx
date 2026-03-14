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
  const [notFound, setNotFound] = useState(false);

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
      setNotFound(false);

      try {
        const response = await fetch(`/api/lessons/${params.lessonId}`);
        const text = await response.text();

        if (!response.ok) {
          let message = response.status === 404 ? "Lesson not found" : "Unable to load lesson.";
          try {
            const parsed = JSON.parse(text) as { error?: string };
            if (parsed?.error && typeof parsed.error === "string") {
              message = parsed.error;
            }
          } catch {
            // Response was not JSON (e.g. HTML error page); keep default message
          }
          if (isMounted) {
            setError(message);
            setNotFound(response.status === 404);
          }
          return;
        }

        let payload: LessonDetailResponse;
        try {
          payload = JSON.parse(text) as LessonDetailResponse;
        } catch {
          if (isMounted) {
            setError("Invalid response from server.");
          }
          return;
        }

        if (!isMounted) return;
        if (payload?.lesson) {
          setLesson(payload.lesson);
        } else {
          setError("Lesson not found");
          setNotFound(true);
        }
      } catch (loadError) {
        if (!isMounted) return;
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

      const text = await response.text();

      if (!response.ok) {
        let message = "Unable to update lesson.";
        try {
          const parsed = JSON.parse(text) as { error?: string };
          if (parsed?.error && typeof parsed.error === "string") {
            message = parsed.error;
          }
        } catch {
          // non-JSON response
        }
        throw new Error(message);
      }

      let payload: LessonDetailResponse;
      try {
        payload = JSON.parse(text) as LessonDetailResponse;
      } catch {
        throw new Error("Invalid response from server.");
      }
      if (payload?.lesson) {
        setLesson(payload.lesson);
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update lesson.");
    } finally {
      setIsSaving(false);
    }
  }

  if (loading || isLoading) {
    return (
      <main className="min-h-screen w-full px-5 py-6" style={{ background: "var(--bg-base)" }}>
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border p-6" style={{ background: "#E8E0D0", borderColor: "#C8BFA8", color: "#4A6358" }}>
            Loading lesson...
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen w-full px-5 py-6" style={{ background: "var(--bg-base)" }}>
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border p-6" style={{ background: "#E8E0D0", borderColor: "#C8BFA8", color: "#4A6358" }}>
            Log in to read personalized lessons.
          </div>
        </div>
      </main>
    );
  }

  if (!lesson) {
    return (
      <main className="min-h-screen w-full px-5 py-6" style={{ background: "var(--bg-base)" }}>
        <div className="mx-auto max-w-5xl">
          <div
            className="rounded-2xl border p-6 text-center"
            style={{ background: "#FFFFFF", borderColor: "#C8BFA8", color: "#1C3A2E" }}
          >
            <h1 className="font-heading text-2xl font-normal" style={{ color: "#1C3A2E" }}>
              {notFound ? "Lesson not found" : "Something went wrong"}
            </h1>
            {error && <p className="mt-2 text-sm" style={{ color: "#4A6358" }}>{error}</p>}
            <Link
              href="/"
              className="mt-6 inline-block rounded-full px-5 py-3 text-sm font-semibold text-white"
              style={{ background: "#C17B3F" }}
            >
              Back to city
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full px-5 py-6" style={{ background: "var(--bg-base)" }}>
      <div className="mx-auto max-w-5xl">
        <section className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/"
              className="text-sm font-medium transition hover:underline"
              style={{ color: "#4A6358" }}
            >
              ← Back to city
            </Link>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "#8A9E94", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>
              {lesson.concept}
            </p>
            <h1 className="mt-2 font-heading text-4xl font-normal" style={{ color: "#1C3A2E" }}>
              {lesson.title}
            </h1>
            <p className="mt-3 text-[13px]" style={{ color: "#8A9E94", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>
              Generated {dateFormatter.format(new Date(lesson.createdAt))}
            </p>
          </div>

          <button
            type="button"
            onClick={toggleCompletion}
            disabled={isSaving}
            className="rounded-full px-5 py-3 text-sm font-semibold text-white transition disabled:opacity-60"
            style={{ background: "#C17B3F" }}
          >
            {isSaving
              ? "Saving..."
              : lesson.completed
                ? "Mark as Incomplete"
                : "Mark as Complete"}
          </button>
        </section>

        {/* Explanation card */}
        <section
          className="rounded-2xl border p-6"
          style={{ background: "#FFFFFF", borderColor: "#C8BFA8", borderRadius: 16 }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "#8A9E94", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>
            Explanation
          </p>
          <p className="mt-4 leading-relaxed" style={{ color: "#4A6358", fontFamily: "var(--font-body), DM Sans, sans-serif", fontSize: 15, lineHeight: 1.6 }}>
            {lesson.explanation}
          </p>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Your Examples card */}
          <div
            className="rounded-2xl border p-6"
            style={{ background: "#FFFFFF", borderColor: "#C8BFA8", borderRadius: 16 }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "#8A9E94", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>
              Your Examples
            </p>
            <div className="mt-5 space-y-3">
              {lesson.examples.map((example, index) => (
                <div
                  key={`${lesson.id}-example-${index}`}
                  className="rounded-xl px-4 py-3"
                  style={{
                    background: "#E8E0D0",
                    color: "#1C3A2E",
                    borderRadius: 12,
                    padding: "12px 16px",
                    fontFamily: "var(--font-body), DM Sans, sans-serif",
                    fontSize: 14,
                    lineHeight: 1.6,
                  }}
                >
                  {example}
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Advice card */}
          <div
            className="rounded-2xl border p-6"
            style={{ background: "#FFFFFF", borderColor: "#C8BFA8", borderRadius: 16 }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "#8A9E94", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>
              Actionable Advice
            </p>
            <div className="mt-5 space-y-3">
              {lesson.advice.map((tip, index) => (
                <div
                  key={`${lesson.id}-advice-${index}`}
                  className="rounded-xl border-l-4 px-4 py-3"
                  style={{
                    background: "#E8F7EE",
                    color: "#1C3A2E",
                    borderLeftColor: "#3DAB6A",
                    borderRadius: 12,
                    padding: "12px 16px",
                    fontFamily: "var(--font-body), DM Sans, sans-serif",
                    fontSize: 14,
                    lineHeight: 1.6,
                  }}
                >
                  {tip}
                </div>
              ))}
            </div>
          </div>
        </section>

        {error ? (
          <section className="mt-6 rounded-2xl border p-4 text-sm" style={{ background: "#FFFFFF", borderColor: "#D94F3D", color: "#D94F3D" }}>
            {error}
          </section>
        ) : null}
      </div>
    </main>
  );
}
