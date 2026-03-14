"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import { useAuth } from "@/hooks/useAuth";
import type { GroupSummary } from "@/types";

export default function GroupsPage() {
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
      throw new Error(payload.error || "Unable to load groups.");
    }

    const payload = (await response.json()) as { groups: GroupSummary[] };
    setGroups(payload.groups);
  }

  useEffect(() => {
    if (!user) {
      return;
    }

    loadGroups().catch((error) => {
      setFeedback(error instanceof Error ? error.message : "Unable to load groups.");
    });
  }, [user]);

  async function createGroup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/groups/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: groupName }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to create group.");
      }

      setGroupName("");
      setFeedback("Group created successfully.");
      await loadGroups();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to create group.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function joinGroup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/groups/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inviteCode }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to join group.");
      }

      setInviteCode("");
      setFeedback("Group joined successfully.");
      await loadGroups();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to join group.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-6">
        <div className="glass-card rounded-[2rem] p-6 text-slate-300">
          Loading groups...
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl px-5 py-10">
        <div className="glass-card rounded-[2rem] p-6">
          <h1 className="text-3xl font-semibold text-white">Login to join groups</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Social leaderboards are tied to authenticated player accounts.
          </p>
          <div className="mt-6">
            <Link
              href="/login"
              className="rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950"
            >
              Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-6">
      <section className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
          Groups
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          Create squads and compare progress
        </h1>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={createGroup}
          className="glass-card rounded-[2rem] p-6"
        >
          <h2 className="text-xl font-semibold text-white">Create Group</h2>
          <input
            type="text"
            required
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
            placeholder="Friday Finance Club"
            className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none focus:border-sky-400"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
          >
            Create Group
          </button>
        </motion.form>

        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={joinGroup}
          className="glass-card rounded-[2rem] p-6"
        >
          <h2 className="text-xl font-semibold text-white">Join Group</h2>
          <input
            type="text"
            required
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value)}
            placeholder="AB12CD34"
            className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none focus:border-sky-400"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            Join Group
          </button>
        </motion.form>
      </section>

      {feedback ? (
        <div className="glass-card mt-6 rounded-2xl p-4 text-sm text-slate-300">
          {feedback}
        </div>
      ) : null}

      <section className="mt-6 space-y-4">
        {groups.map((group) => (
          <div key={group.id} className="glass-card rounded-[2rem] p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white">{group.name}</h2>
                <p className="mt-2 text-sm text-slate-300">
                  Invite code: <span className="text-sky-300">{group.invite_code}</span> ·{" "}
                  {group.memberCount} members
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/30 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
                  Members
                </h3>
                <div className="mt-3 space-y-2">
                  {group.members.map((member) => (
                    <Link
                      key={`${group.id}-${member.userId}`}
                      href={`/groups/${group.id}/members/${member.userId}`}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 transition hover:border-sky-400/40 hover:bg-slate-950/60"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {member.username}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                          {member.role === "owner" ? "Owner" : "Member"}
                          {member.userId === user.id ? " · You" : ""}
                        </p>
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
                        View
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
                  Leaderboard
                </h3>
                <div className="space-y-3">
                  {group.leaderboard.map((entry, index) => (
                    <div
                      key={`${group.id}-${entry.userId}`}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/30 p-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">
                          #{index + 1} {entry.username}
                        </p>
                        <p className="mt-1 text-sm text-slate-300">
                          Level {entry.level} · City Growth {entry.cityGrowth}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-sky-300">
                        {entry.xp} XP
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {groups.length === 0 ? (
          <div className="glass-card rounded-[2rem] p-6 text-sm text-slate-300">
            You are not in any groups yet. Create one or join with an invite code.
          </div>
        ) : null}
      </section>
    </main>
  );
}
