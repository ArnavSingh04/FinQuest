"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { CityScene } from "@/components/city/CityScene";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { useAuth } from "@/hooks/useAuth";
import { useCityStore } from "@/store/useCityStore";
import type { GroupMemberProfileResponse } from "@/types";

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export default function GroupMemberPage() {
  const params = useParams<{ groupId: string; memberId: string }>();
  const { user, loading } = useAuth();
  const setCityMetrics = useCityStore((state) => state.setCityMetrics);
  const setHoveredStructure = useCityStore((state) => state.setHoveredStructure);
  const setSelectedStructure = useCityStore((state) => state.setSelectedStructure);
  const [profile, setProfile] = useState<GroupMemberProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadProfile() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/groups/${params.groupId}/members/${params.memberId}`,
        );

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error || "Unable to load member profile.");
        }

        const payload = (await response.json()) as GroupMemberProfileResponse;

        if (!isMounted) {
          return;
        }

        setProfile(payload);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load member profile.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [loading, params.groupId, params.memberId, user]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setCityMetrics(profile.dashboard.cityMetrics);
    setHoveredStructure(null);
    setSelectedStructure(null);
  }, [profile, setCityMetrics, setHoveredStructure, setSelectedStructure]);

  if (loading || isLoading) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-6">
        <div className="glass-card rounded-[2rem] p-6 text-slate-300">
          Loading member profile...
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl px-5 py-10">
        <div className="glass-card rounded-[2rem] p-6">
          <h1 className="text-3xl font-semibold text-white">Login to view member cities</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Group member stats and city views are only available to signed-in players.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/login"
              className="rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950"
            >
              Login
            </Link>
            <Link
              href="/groups"
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white"
            >
              Back to Groups
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-6">
        <div className="glass-card rounded-[2rem] p-6 text-rose-300">
          {error || "Member profile is unavailable right now."}
        </div>
      </main>
    );
  }

  const { dashboard, group, member } = profile;
  const xpProgress =
    dashboard.progress.nextLevelXp > 0
      ? Math.min(100, (dashboard.progress.xp / dashboard.progress.nextLevelXp) * 100)
      : 0;

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-5 py-6 sm:max-w-6xl">
      <section className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
            Group Member View
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            {member.username}&apos;s city
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            {group.name} · {member.role === "owner" ? "Owner" : "Member"}
            {member.userId === user.id ? " · You" : ""}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/groups"
            className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-white"
          >
            Back to Groups
          </Link>
          {member.userId === user.id ? (
            <Link
              href="/city"
              className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-white"
            >
              Open Your City
            </Link>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <CityScene />
          {member.userId === user.id && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="glass-card rounded-2xl p-4">
                <p className="text-sm text-slate-300">Economy</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {dashboard.cityMetrics.economyScore}
                </p>
              </div>
              <div className="glass-card rounded-2xl p-4">
                <p className="text-sm text-slate-300">Infrastructure</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {dashboard.cityMetrics.infrastructure}
                </p>
              </div>
              <div className="glass-card rounded-2xl p-4">
                <p className="text-sm text-slate-300">Pollution</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {dashboard.cityMetrics.pollution}
                </p>
              </div>
              <div className="glass-card rounded-2xl p-4">
                <p className="text-sm text-slate-300">Growth</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {dashboard.cityMetrics.growth}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="glass-card rounded-[2rem] p-5 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
              XP Progress
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Level {dashboard.progress.level}
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              {dashboard.progress.xp} / {dashboard.progress.nextLevelXp} XP
            </p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>

          {member.userId === user.id && (
            <div className="glass-card rounded-[2rem] p-5 sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
                Snapshot
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <StatsCard
                  label="Transactions"
                  value={`${dashboard.transactionCount}`}
                  helperText="Total spending entries recorded for this player."
                />
                <StatsCard
                  label="Total Spent"
                  value={`$${dashboard.totalSpent.toFixed(2)}`}
                  helperText="Combined value of all saved transactions."
                  accent="from-violet-400/30 to-sky-400/10"
                />
              </div>
            </div>
          )}

          <div className="glass-card rounded-[2rem] p-5 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
              Achievements
            </p>
            <div className="mt-4 space-y-3">
              {dashboard.progress.achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`rounded-2xl border p-4 ${
                    achievement.unlocked
                      ? "border-emerald-400/30 bg-emerald-500/10"
                      : "border-white/10 bg-slate-950/30"
                  }`}
                >
                  <p className="text-sm font-semibold text-white">{achievement.title}</p>
                  <p className="mt-1 text-sm text-slate-300">
                    {achievement.description}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-sky-300">
                    {achievement.xpReward} XP
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {member.userId === user.id && (
        <>
          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              label="Needs Ratio"
              value={formatPercent(dashboard.ratios.needs_ratio)}
              helperText="Needs support housing and essential infrastructure."
            />
            <StatsCard
              label="Wants Ratio"
              value={formatPercent(dashboard.ratios.wants_ratio)}
              helperText="Lifestyle spending powers malls and fun districts."
              accent="from-fuchsia-400/30 to-violet-400/10"
            />
            <StatsCard
              label="Treat Ratio"
              value={formatPercent(dashboard.ratios.treat_ratio)}
              helperText="Too many treats can raise pollution pressure."
              accent="from-orange-400/30 to-red-400/10"
            />
            <StatsCard
              label="Invest Ratio"
              value={formatPercent(dashboard.ratios.invest_ratio)}
              helperText="Investing increases long-term city growth."
              accent="from-emerald-400/30 to-cyan-400/10"
            />
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.7fr]">
            <div className="glass-card rounded-[2rem] p-5 sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
                Latest Insight
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Financial coach summary
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                {dashboard.latestInsight?.insight ||
                  "This member has not generated an AI insight yet."}
              </p>
            </div>
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-3">
            <StatsCard
              label="Liquidity"
              value={`${dashboard.scores.liquidity}`}
              helperText="Spending flexibility available to this player."
            />
            <StatsCard
              label="Budget Health"
              value={`${dashboard.scores.budgetHealth}`}
              helperText="Balanced habits keep the city resilient."
              accent="from-violet-400/30 to-sky-400/10"
            />
            <StatsCard
              label="Stability"
              value={`${dashboard.scores.stability}`}
              helperText={
                dashboard.cityMetrics.emergencyWarning
                  ? "Low liquidity triggered a city stability warning."
                  : "Stable finances keep the city calm."
              }
              accent="from-amber-400/30 to-orange-400/10"
            />
          </section>
        </>
      )}

      {error ? (
        <section className="glass-card mt-6 rounded-[2rem] p-5 text-sm text-rose-300">
          {error}
        </section>
      ) : null}
    </main>
  );
}
