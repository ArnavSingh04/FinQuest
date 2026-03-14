"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useAuth } from "@/hooks/useAuth";
import type { GroupSummary } from "@/types";

export function GroupsSheetContent() {
  const { user, loading } = useAuth();
  const [groups, setGroups] = useState<GroupSummary[]>([]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/groups/list")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { groups: GroupSummary[] } | null) =>
        setGroups(data?.groups ?? [])
      );
  }, [user]);

  if (loading || !user) {
    return (
      <div className="px-4 py-8 text-center text-text-muted">
        {loading ? "Loading…" : "Log in to view groups."}
      </div>
    );
  }

  return (
    <div className="px-4 pb-6">
      <p className="text-sm text-text-secondary">
        Create or join a group to compare cities with friends.
      </p>
      <div className="mt-4 flex gap-3">
        <Link
          href="/groups"
          className="flex-1 rounded-2xl border border-border bg-bg-surface py-3 text-center text-sm font-semibold text-text-primary"
        >
          Open Groups
        </Link>
      </div>
      <ul className="mt-4 space-y-2">
        {groups.map((g) => (
          <li
            key={g.id}
            className="rounded-2xl border border-border bg-bg-surface p-4"
          >
            <p className="font-heading font-normal text-text-primary">{g.name}</p>
            <p className="mt-1 text-xs text-text-muted">
              {g.invite_code} · {g.memberCount} members
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
