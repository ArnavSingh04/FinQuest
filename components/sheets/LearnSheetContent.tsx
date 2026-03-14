"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/store/useUIStore";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Lesson, LessonDetailResponse, LessonsListResponse } from "@/types";

export function LearnSheetContent() {
  const { user, loading } = useAuth();
  const setActiveSheet = useUIStore((s) => s.setActiveSheet);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [filter, setFilter] = useState<"active" | "completed">("active");
  const [isGenerating, setIsGenerating] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const loadLessons = useCallback(async () => {
    if (!user) return;
    const res = await fetch("/api/lessons");
    if (!res.ok) return;
    const data = (await res.json()) as LessonsListResponse;
    setLessons(data.lessons ?? []);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadLessons();
  }, [user, loadLessons]);

  async function handleGenerateLesson() {
    if (!user || isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/lessons/generate", { method: "POST" });
      if (!res.ok) {
        const payload = (await res.json()) as { error?: string };
        throw new Error(payload.error ?? "Unable to generate lesson.");
      }
      await loadLessons();
      listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      // ignore
    } finally {
      setIsGenerating(false);
    }
  }

  async function markAsComplete(lesson: Lesson) {
    if (completingId) return;
    setCompletingId(lesson.id);
    try {
      const res = await fetch(`/api/lessons/${lesson.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !lesson.completed }),
      });
      if (!res.ok) throw new Error("Update failed");
      const payload = (await res.json()) as LessonDetailResponse;
      setLessons((prev) => prev.map((l) => (l.id === lesson.id ? payload.lesson : l)));
    } catch {
      // ignore
    } finally {
      setCompletingId(null);
    }
  }

  const activeLessons = lessons.filter((l) => !l.completed);
  const completedLessons = lessons.filter((l) => l.completed);
  const displayed = filter === "active" ? activeLessons : completedLessons;

  if (loading || !user) {
    return (
      <div className="px-4 py-8 text-center" style={{ color: "#8A9E94", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>
        {loading ? "Loading…" : "Log in to view lessons."}
      </div>
    );
  }

  return (
    <div className="px-4 pb-6">
      {/* Sheet header: title 22px + subtitle (BottomSheet may also show "Learn"; this ensures 22px + subtitle) */}
      <h2 className="font-heading font-normal" style={{ fontSize: 22, color: "#1C3A2E" }}>
        Learn
      </h2>
      <p className="mt-1 text-[13px]" style={{ color: "#8A9E94", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>
        AI lessons from your spending
      </p>

      {/* Generate New Lesson */}
      <button
        type="button"
        onClick={handleGenerateLesson}
        disabled={isGenerating}
        className="mt-4 flex w-full items-center justify-center rounded-full py-3 text-sm font-semibold text-white transition disabled:opacity-70"
        style={{ height: 48, background: "#C17B3F", fontFamily: "var(--font-body), DM Sans, sans-serif" }}
      >
        {isGenerating ? (
          <span className="animate-pulse">Generating...</span>
        ) : (
          <>✨ Generate New Lesson</>
        )}
      </button>

      {/* Active / Completed toggle */}
      <div
        className="mt-4 flex w-full rounded-full p-1"
        style={{ background: "#E8E0D0" }}
      >
        <button
          type="button"
          onClick={() => setFilter("active")}
          className="flex flex-1 items-center justify-center rounded-full py-2 text-[13px] font-medium transition"
          style={{
            fontFamily: "var(--font-body), DM Sans, sans-serif",
            ...(filter === "active"
              ? { background: "#1C3A2E", color: "#F2EDE3" }
              : { background: "transparent", color: "#4A6358" }),
          }}
        >
          Active
        </button>
        <button
          type="button"
          onClick={() => setFilter("completed")}
          className="flex flex-1 items-center justify-center rounded-full py-2 text-[13px] font-medium transition"
          style={{
            fontFamily: "var(--font-body), DM Sans, sans-serif",
            ...(filter === "completed"
              ? { background: "#1C3A2E", color: "#F2EDE3" }
              : { background: "transparent", color: "#4A6358" }),
          }}
        >
          Completed
        </button>
      </div>

      {/* Lesson list — only when we have lessons */}
      {lessons.length > 0 && (
        <ul ref={listRef} className="mt-4 space-y-3">
          {filter === "completed" && completedLessons.length === 0 ? (
            <li className="py-6 text-center text-[13px]" style={{ color: "#8A9E94", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>
              No completed lessons yet
            </li>
          ) : (
            displayed.map((lesson) => {
            const isCompleted = lesson.completed;
            const isMuted = filter === "active" && isCompleted;

            return (
              <li
                key={lesson.id}
                className="rounded-2xl border p-4 transition"
                style={{
                  background: "#FFFFFF",
                  borderColor: "#C8BFA8",
                  opacity: isMuted ? 0.75 : 1,
                }}
              >
                <Link href={`/lessons/${lesson.id}`} className="block">
                  <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "#8A9E94", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>
                    {isCompleted && <span style={{ color: "#3DAB6A" }} aria-hidden>✓</span>}
                    {lesson.concept}
                  </p>
                  <h3 className="mt-1 font-heading text-lg font-normal" style={{ color: "#1C3A2E" }}>
                    {lesson.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm" style={{ color: "#4A6358", fontFamily: "var(--font-body), DM Sans, sans-serif" }}>
                    {lesson.previewText}
                  </p>
                </Link>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    markAsComplete(lesson);
                  }}
                  disabled={completingId === lesson.id}
                  className="mt-3 rounded-lg border-2 px-3 py-1.5 text-xs font-medium transition disabled:opacity-50"
                  style={{ borderColor: "#1C3A2E", color: "#1C3A2E", background: "transparent", fontFamily: "var(--font-body), DM Sans, sans-serif" }}
                >
                  {completingId === lesson.id ? "Updating…" : lesson.completed ? "Mark Incomplete" : "Mark Complete"}
                </button>
              </li>
            );
          })
        )}
        </ul>
      )}

      {lessons.length === 0 && (
        <EmptyState
          heading="No lessons yet"
          subtext="Complete transactions to unlock personalized lessons, or log a purchase to get started."
          ctaLabel="Log Spend"
          onCta={() => setActiveSheet("log")}
        />
      )}
    </div>
  );
}
