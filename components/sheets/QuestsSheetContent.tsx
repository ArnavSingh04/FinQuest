"use client";

import { useQuestsStore } from "@/store/useQuestsStore";
import { useGameStore } from "@/store/useGameStore";
import { EmptyState } from "@/components/ui/EmptyState";

const CAT_BORDER: Record<string, string> = {
  Need: "border-l-cat-need",
  Want: "border-l-cat-want",
  Treat: "border-l-cat-treat",
  Invest: "border-l-cat-invest",
};

const CAT_BG: Record<string, string> = {
  Need: "bg-cat-need",
  Want: "bg-cat-want",
  Treat: "bg-cat-treat",
  Invest: "bg-cat-invest",
};

const STATUS_STYLE: Record<string, string> = {
  active: "text-cat-want",
  completed: "text-cat-invest",
  failed: "text-cat-treat",
};

export function QuestsSheetContent() {
  const { quests, lessons, completedLessonIds, completeLesson, completeQuest } =
    useQuestsStore();

  const rewardBuildings    = useGameStore((s) => s.rewardBuildings);
  const pendingRewardQuestId = useGameStore((s) => s.pendingRewardQuestId);
  const unlockReward       = useGameStore((s) => s.unlockReward);

  // helpers ─────────────────────────────────────────────────────────────────
  function claimedRewardFor(questId: string) {
    return rewardBuildings.find((r) => r.questId === questId);
  }

  function isPendingClaim(questId: string) {
    return pendingRewardQuestId === questId;
  }

  function isCompletedNoReward(quest: { id: string; status: string }) {
    if (quest.status !== "completed") return false;
    if (claimedRewardFor(quest.id)) return false;
    if (isPendingClaim(quest.id)) return false;
    return true;
  }

  return (
    <div className="px-4 pb-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-xl font-normal text-text-primary">
          Active Quests
        </h2>
        <span className="rounded-full bg-accent-primary/15 px-2.5 py-0.5 text-xs font-semibold text-accent-primary">
          {quests.length}
        </span>
      </div>

      {quests.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            heading="Complete lessons to unlock city quests"
            subtext="Finish a lesson below to generate your first quest."
            ctaLabel="See lessons"
            onCta={() =>
              document.getElementById("quests-lessons")?.scrollIntoView({ behavior: "smooth" })
            }
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {quests.map((q) => {
            const claimed   = claimedRewardFor(q.id);
            const pending   = isPendingClaim(q.id);
            const unclaimed = isCompletedNoReward(q);

            return (
              <li
                key={q.id}
                className={`rounded-2xl border border-border border-l-4 bg-bg-elevated shadow-card ${CAT_BORDER[q.category]}`}
              >
                {/* Main card content */}
                <div className="p-4">
                  <p className="font-heading text-base font-normal text-text-primary">
                    {q.title}
                  </p>

                  {/* Progress bar */}
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border/40">
                    <div
                      className={`h-full rounded-full ${CAT_BG[q.category]}`}
                      style={{
                        width: `${Math.min(100, (q.current / q.target) * 100)}%`,
                      }}
                    />
                  </div>

                  {/* Status + mark-complete */}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className={`text-xs font-semibold ${STATUS_STYLE[q.status]}`}>
                      {q.status.charAt(0).toUpperCase() + q.status.slice(1)}
                    </p>
                    {q.status === "active" && (
                      <button
                        type="button"
                        onClick={() => completeQuest(q.id)}
                        className="rounded-full border border-border px-3 py-1 text-xs font-medium text-text-secondary transition-colors active:scale-95 hover:bg-bg-surface"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>

                {/* ── Reward footer ── */}
                <div
                  className="border-t border-border px-4 py-2.5"
                  style={{ borderColor: "#E8E0D0" }}
                >
                  {claimed ? (
                    /* Reward already placed in city */
                    <p className="text-xs font-medium" style={{ color: "#3DAB6A" }}>
                      ✓{" "}
                      {claimed.type === "gold_tower"
                        ? "Gold Tower placed in your city"
                        : "Park planted in your city"}
                    </p>
                  ) : pending ? (
                    /* Modal is currently open for this quest */
                    <p className="text-xs font-medium" style={{ color: "#C9A84C" }}>
                      🏆 Choose your reward…
                    </p>
                  ) : unclaimed ? (
                    /* Reward available but modal was dismissed */
                    <button
                      type="button"
                      onClick={() => unlockReward(q.id, q.title)}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-transform active:scale-95"
                      style={{
                        background: "#C9A84C",
                        color: "#1C3A2E",
                        animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
                      }}
                    >
                      🏆 Claim Reward →
                    </button>
                  ) : (
                    /* Active quest — preview */
                    <p className="text-xs" style={{ color: "#8A9E94" }}>
                      <span style={{ color: "#C9A84C" }}>🏆</span> Reward: Gold Tower or Park
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* ── Lessons section ── */}
      <p id="quests-lessons" className="label mt-8 text-text-muted">
        Lessons
      </p>
      <p className="mt-1 text-sm text-text-secondary">
        Complete a lesson to unlock a matching quest above.
      </p>

      <ul className="mt-4 space-y-3">
        {lessons.map((lesson) => {
          const completed = completedLessonIds.has(lesson.id);
          return (
            <li
              key={lesson.id}
              className="rounded-2xl border border-border bg-bg-elevated p-4 shadow-card"
            >
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${CAT_BG[lesson.category]} text-white`}
              >
                {lesson.concept}
              </span>
              <h3 className="mt-2 font-heading text-base font-normal text-text-primary">
                {lesson.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm text-text-secondary">
                {lesson.previewText}
              </p>
              <button
                type="button"
                onClick={() => completeLesson(lesson.id)}
                disabled={completed}
                className="mt-3 rounded-full bg-accent-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {completed ? "Completed" : "Start"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
