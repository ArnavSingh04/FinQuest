"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import type {
  GroupLeaderboardEntry,
  GroupSummary,
} from "@/types";

export function GroupsSheetContent() {
  const { user, loading } = useAuth();
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadGroups() {
    const response = await fetch("/api/groups/list");
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      throw new Error(payload.error ?? "Unable to load.");
    }
    const payload = (await response.json()) as { groups: GroupSummary[] };
    setGroups(payload.groups ?? []);
  }

  useEffect(() => {
    if (!user) return;
    loadGroups().catch(() => setGroups([]));
  }, [user]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/groups/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Unable to create.");
      }
      setGroupName("");
      setFeedback("City network created.");
      await loadGroups();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Unable to join.");
      }
      setInviteCode("");
      setFeedback("You entered the city.");
      await loadGroups();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyGateCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setFeedback("City gate code copied.");
      setTimeout(() => setFeedback(null), 2000);
    } catch {
      setFeedback("Could not copy.");
    }
  }

  if (loading || !user) {
    return (
      <div className="px-4 py-8 text-center text-text-muted">
        {loading ? "Loading…" : "Log in to view City Network."}
      </div>
    );
  }

  const currentGroup = groups[0] ?? null;

  return (
    <div className="px-4 pb-6">
      <h2 className="font-heading text-xl font-normal text-text-primary">
        City Network <span aria-hidden>🌐</span>
      </h2>

      {!currentGroup ? (
        <>
          <p className="mt-1 text-sm text-text-secondary">
            Open your city to visitors or enter a friend’s city.
          </p>

          {/* Card 1 — Open Your Gates */}
          <form onSubmit={handleCreate} className="mt-6">
            <div className="rounded-2xl border border-border border-l-4 border-l-accent-primary bg-bg-elevated p-4 shadow-card">
              <p className="flex items-center gap-2 font-heading text-base font-normal text-text-primary">
                <span aria-hidden>🏛️</span> Open Your Gates
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                Share your city with friends for mutual accountability.
              </p>
              <input
                type="text"
                required
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Name your alliance"
                className="mt-4 w-full rounded-xl border border-border bg-bg-surface px-4 py-3 text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-accent-primary/30"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-4 w-full rounded-full bg-accent-primary py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                Create City Network
              </button>
            </div>
          </form>

          <div className="flex items-center gap-3 py-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
              or
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Card 2 — Visit a City */}
          <form onSubmit={handleJoin}>
            <div className="rounded-2xl border border-border border-l-4 border-l-cat-need bg-bg-elevated p-4 shadow-card">
              <p className="flex items-center gap-2 font-heading text-base font-normal text-text-primary">
                <span aria-hidden>🧭</span> Visit a City
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                Enter a gate code to visit and follow a friend’s city.
              </p>
              <input
                type="text"
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Enter gate code"
                className="mt-4 w-full rounded-xl border border-border bg-bg-surface px-4 py-3 font-mono text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-cat-need/30"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-4 w-full rounded-full bg-cat-need py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                Enter City
              </button>
            </div>
          </form>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-text-secondary">
            {currentGroup.name} · {currentGroup.memberCount} visitor
            {currentGroup.memberCount !== 1 ? "s" : ""}
          </p>

          <button
            type="button"
            onClick={() => copyGateCode(currentGroup.invite_code)}
            className="mt-4 rounded-full border border-border bg-bg-surface px-4 py-2 font-mono text-sm text-text-primary"
          >
            {currentGroup.invite_code}
          </button>
          <p className="mt-1 text-xs text-text-muted">Tap to copy city gate code</p>

          <p className="label mt-6 text-text-muted">Visitors</p>
          <ul className="mt-2 space-y-3">
            {(currentGroup.leaderboard ?? []).map((entry) => (
              <VisitorCard key={entry.userId} entry={entry} groupId={currentGroup.id} />
            ))}
          </ul>
        </>
      )}

      {feedback && (
        <p className="mt-4 text-sm text-text-secondary">{feedback}</p>
      )}
    </div>
  );
}

function healthColor(score: number) {
  if (score >= 70) return "bg-cat-invest text-white";
  if (score >= 40) return "bg-cat-want text-white";
  return "bg-cat-treat text-white";
}

function VisitorCard({
  entry,
  groupId,
}: {
  entry: GroupLeaderboardEntry;
  groupId: string;
}) {
  const initial = (entry.username ?? "?")[0].toUpperCase();
  const healthScore = Math.round(entry.cityGrowth ?? 0);

  return (
    <li className="flex items-center gap-3 rounded-2xl border border-border bg-bg-elevated p-4 shadow-card">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-primary/20 font-heading text-base font-normal text-accent-primary"
        aria-hidden
      >
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-text-primary">{entry.username}</p>
        <span
          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${healthColor(healthScore)}`}
        >
          {healthScore} health
        </span>
      </div>
      <a
        href={`/groups/${groupId}/members/${entry.userId}`}
        className="shrink-0 rounded-full border border-border bg-bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary"
      >
        Visit City
      </a>
    </li>
  );
}
