"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/store/useUIStore";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Lesson, LessonsListResponse } from "@/types";

export function LearnSheetContent() {
  const { user, loading } = useAuth();
  const setActiveSheet = useUIStore((s) => s.setActiveSheet);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/lessons")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: LessonsListResponse | null) =>
        setLessons(data?.lessons ?? [])
      );
  }, [user]);

  if (loading || !user) {
    return (
      <div className="px-4 py-8 text-center text-text-muted">
        {loading ? "Loading…" : "Log in to view lessons."}
      </div>
    );
  }

  return (
    <div className="px-4 pb-6">
      <ul className="space-y-3">
        {lessons.map((lesson) => (
          <li key={lesson.id}>
            <Link
              href={`/lessons/${lesson.id}`}
              className="block rounded-2xl border border-border bg-bg-surface p-4 transition hover:border-accent-primary/30"
            >
              <p className="label text-text-muted">{lesson.concept}</p>
              <h3 className="mt-1 font-heading text-lg font-normal text-text-primary">
                {lesson.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm text-text-secondary">
                {lesson.previewText}
              </p>
            </Link>
          </li>
        ))}
      </ul>
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
