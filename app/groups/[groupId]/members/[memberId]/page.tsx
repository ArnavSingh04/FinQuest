"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { CityScene } from "@/components/city/CityScene";
import { useAuth } from "@/hooks/useAuth";
import type { GroupMemberProfileResponse } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

// ── Local design tokens ───────────────────────────────────────────────────────

const CARD: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #C8BFA8",
  borderRadius: 16,
  padding: "20px",
  boxShadow: "0 2px 12px rgba(44,36,22,0.06)",
};

const LABEL: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#8A9E94",
  margin: 0,
};

// ── Ratio card ────────────────────────────────────────────────────────────────

function RatioCard({
  label, value, description, bg, accent,
}: {
  label: string; value: string; description: string;
  bg: string; accent: string;
}) {
  return (
    <div
      style={{
        background: bg,
        borderLeft: `4px solid ${accent}`,
        borderRadius: 12,
        padding: "14px 16px",
        flex: 1,
        minWidth: 0,
      }}
    >
      <p style={{ ...LABEL, color: accent, marginBottom: 4 }}>{label}</p>
      <p
        style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 28,
          color: "#1C3A2E",
          lineHeight: 1,
          margin: "0 0 4px",
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12,
          color: "#4A6358",
          margin: 0,
        }}
      >
        {description}
      </p>
    </div>
  );
}

// ── Metric card ───────────────────────────────────────────────────────────────

function MetricCard({
  label, value, helperText,
}: {
  label: string; value: string | number; helperText?: string;
}) {
  return (
    <div style={CARD}>
      <p style={{ ...LABEL, marginBottom: 6 }}>{label}</p>
      <p
        style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 28,
          color: "#1C3A2E",
          margin: 0,
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      {helperText && (
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: "#4A6358",
            margin: "6px 0 0",
            lineHeight: 1.5,
          }}
        >
          {helperText}
        </p>
      )}
    </div>
  );
}

// ── Achievement card ──────────────────────────────────────────────────────────

function AchievementCard({
  title, description, xpReward, unlocked,
}: {
  title: string; description: string; xpReward: number; unlocked: boolean;
}) {
  return (
    <div
      style={{
        background: unlocked ? "#FFFFFF" : "#F2EDE3",
        border: "1px solid #C8BFA8",
        borderRadius: 12,
        padding: "14px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {/* Title row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <p
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 15,
            color: unlocked ? "#1C3A2E" : "#8A9E94",
            margin: 0,
            lineHeight: 1.3,
            flex: 1,
          }}
        >
          {title}
        </p>
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            background: unlocked ? "#3DAB6A" : "#E8E0D0",
            color: unlocked ? "#FFFFFF" : "#8A9E94",
            padding: "2px 8px",
            borderRadius: 999,
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {unlocked ? "Unlocked" : "Locked"}
        </span>
      </div>

      {/* Description — always visible */}
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12,
          color: unlocked ? "#4A6358" : "#8A9E94",
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>

      {/* XP badge */}
      <div>
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            background: unlocked ? "#C17B3F" : "#E8E0D0",
            color: unlocked ? "#FFFFFF" : "#8A9E94",
            padding: "2px 8px",
            borderRadius: 999,
          }}
        >
          +{xpReward} XP
        </span>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function GroupMemberPage() {
  const params = useParams<{ groupId: string; memberId: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<GroupMemberProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { setIsLoading(false); return; }

    let isMounted = true;
    async function loadProfile() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/groups/${params.groupId}/members/${params.memberId}`
        );
        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error || "Unable to load member profile.");
        }
        const payload = (await response.json()) as GroupMemberProfileResponse;
        if (isMounted) setProfile(payload);
      } catch (loadError) {
        if (isMounted)
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load member profile."
          );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadProfile();
    return () => { isMounted = false; };
  }, [loading, params.groupId, params.memberId, user]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading || isLoading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#F2EDE3",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: "#8A9E94",
          }}
        >
          Loading member profile…
        </p>
      </main>
    );
  }

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#F2EDE3",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 28,
            color: "#1C3A2E",
            margin: "0 0 12px",
          }}
        >
          Login to view member cities
        </h1>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: "#4A6358",
            marginBottom: 24,
          }}
        >
          Group member stats and city views are only available to signed-in players.
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <Link
            href="/login"
            style={{
              background: "#C17B3F",
              color: "#FFFFFF",
              borderRadius: 999,
              padding: "10px 24px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Login
          </Link>
          <Link
            href="/groups"
            style={{
              border: "1px solid #1C3A2E",
              color: "#1C3A2E",
              borderRadius: 999,
              padding: "10px 24px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            ← Back to Groups
          </Link>
        </div>
      </main>
    );
  }

  // ── Error / no profile ─────────────────────────────────────────────────────
  if (!profile) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#F2EDE3",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#D94F3D" }}>
          {error || "Member profile is unavailable right now."}
        </p>
      </main>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  const { dashboard, group, member } = profile;
  const xpProgress =
    dashboard.progress.nextLevelXp > 0
      ? Math.min(100, (dashboard.progress.xp / dashboard.progress.nextLevelXp) * 100)
      : 0;
  const unlockedCount = dashboard.progress.achievements.filter((a) => a.unlocked).length;
  const isSelf = member.userId === user.id;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F2EDE3",
        padding: "24px 16px 64px",
        maxWidth: 960,
        margin: "0 auto",
      }}
    >
      {/* ── Header ── */}
      <section
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div>
          <p style={{ ...LABEL, marginBottom: 8 }}>Group Member View</p>
          <h1
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 32,
              color: "#1C3A2E",
              margin: "0 0 6px",
              lineHeight: 1.2,
            }}
          >
            {member.username}&apos;s city
          </h1>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: "#4A6358",
              margin: 0,
            }}
          >
            {group.name} · {member.role === "owner" ? "Owner" : "Member"}
            {isSelf ? " · You" : ""}
          </p>
        </div>

        {/* Navigation buttons */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => router.push("/")}
            style={{
              background: "#1C3A2E",
              border: "none",
              color: "#F2EDE3",
              borderRadius: 999,
              padding: "10px 20px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            ← Back to my city
          </button>
          {isSelf && (
            <Link
              href="/city"
              style={{
                background: "#C17B3F",
                color: "#FFFFFF",
                borderRadius: 999,
                padding: "8px 16px",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Open Your City →
            </Link>
          )}
        </div>
      </section>

      {/* ── Ratio cards (always shown) ── */}
      {isSelf && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
          <RatioCard
            label="Needs Ratio"
            value={formatPercent(dashboard.ratios.needs_ratio)}
            description="Housing & essentials"
            bg="#EBF2FC"
            accent="#3B7DD8"
          />
          <RatioCard
            label="Wants Ratio"
            value={formatPercent(dashboard.ratios.wants_ratio)}
            description="Lifestyle & dining"
            bg="#FDF3E0"
            accent="#E8A020"
          />
          <RatioCard
            label="Treat Ratio"
            value={formatPercent(dashboard.ratios.treat_ratio)}
            description="Impulse & luxuries"
            bg="#FCECEA"
            accent="#D94F3D"
          />
          <RatioCard
            label="Invest Ratio"
            value={formatPercent(dashboard.ratios.invest_ratio)}
            description="Savings & growth"
            bg="#E8F7EE"
            accent="#3DAB6A"
          />
        </div>
      )}

      {/* ── Main two-column grid ── */}
      <section
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "minmax(0,1.2fr) minmax(0,0.8fr)",
        }}
      >
        {/* Left — city canvas */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={CARD}>
            <div
              style={{
                overflow: "hidden",
                borderRadius: 12,
                border: "1px solid #C8BFA8",
                height: 320,
              }}
            >
              <CityScene height="h-full" />
            </div>
          </div>

          {/* City metrics (own profile only) */}
          {isSelf && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <MetricCard
                label="Economy"
                value={dashboard.cityMetrics.economyScore}
                helperText="Overall economic output"
              />
              <MetricCard
                label="Infrastructure"
                value={dashboard.cityMetrics.infrastructure}
                helperText="Needs coverage score"
              />
              <MetricCard
                label="Pollution"
                value={dashboard.cityMetrics.pollution}
                helperText="Treat spending impact"
              />
              <MetricCard
                label="Growth"
                value={dashboard.cityMetrics.growth}
                helperText="Investment-driven growth"
              />
            </div>
          )}

          {/* Latest insight (own profile only) */}
          {isSelf && (
            <div style={CARD}>
              <p style={{ ...LABEL, marginBottom: 8 }}>Latest Insight</p>
              <h2
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: 20,
                  color: "#1C3A2E",
                  margin: "0 0 8px",
                }}
              >
                Financial coach summary
              </h2>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  color: "#4A6358",
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                {dashboard.latestInsight?.insight ||
                  "This member has not generated an AI insight yet."}
              </p>
            </div>
          )}

          {/* Bottom metrics (own profile only) */}
          {isSelf && (
            <div style={{ display: "flex", gap: 10 }}>
              <MetricCard
                label="Liquidity"
                value={dashboard.scores.liquidity}
                helperText="Spending flexibility"
              />
              <MetricCard
                label="Budget Health"
                value={dashboard.scores.budgetHealth}
                helperText="Balanced habits"
              />
              <MetricCard
                label="Stability"
                value={dashboard.scores.stability}
                helperText={
                  dashboard.cityMetrics.emergencyWarning
                    ? "⚠ Stability warning"
                    : "Stable finances"
                }
              />
            </div>
          )}
        </div>

        {/* Right — XP, snapshot, achievements */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* XP Progress */}
          <div style={CARD}>
            <p style={{ ...LABEL, marginBottom: 8 }}>XP Progress</p>
            <h2
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 24,
                color: "#1C3A2E",
                margin: "0 0 4px",
              }}
            >
              Level {dashboard.progress.level}
            </h2>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: "#4A6358",
                margin: "0 0 12px",
              }}
            >
              {dashboard.progress.xp} / {dashboard.progress.nextLevelXp} XP
            </p>
            {/* Progress bar */}
            <div
              style={{
                height: 8,
                borderRadius: 999,
                background: "#E8E0D0",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: 999,
                  background: "#C17B3F",
                  width: `${xpProgress}%`,
                  transition: "width 600ms ease",
                }}
              />
            </div>
          </div>

          {/* Snapshot (own profile only) */}
          {isSelf && (
            <div style={CARD}>
              <p style={{ ...LABEL, marginBottom: 12 }}>Snapshot</p>
              <div style={{ display: "flex", gap: 10 }}>
                <MetricCard
                  label="Transactions"
                  value={dashboard.transactionCount}
                  helperText="Total entries"
                />
                <MetricCard
                  label="Total Spent"
                  value={`$${dashboard.totalSpent.toFixed(0)}`}
                  helperText="Combined value"
                />
              </div>
            </div>
          )}

          {/* Achievements */}
          <div style={CARD}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <p style={LABEL}>Achievements</p>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  color: "#1C3A2E",
                  margin: 0,
                  fontWeight: 500,
                }}
              >
                {unlockedCount}/{dashboard.progress.achievements.length} unlocked
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {dashboard.progress.achievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  title={achievement.title}
                  description={achievement.description}
                  xpReward={achievement.xpReward}
                  unlocked={achievement.unlocked}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Error banner ── */}
      {error && (
        <div
          style={{
            marginTop: 16,
            padding: "12px 16px",
            background: "#FCECEA",
            border: "1px solid #D94F3D",
            borderRadius: 12,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: "#D94F3D",
          }}
        >
          {error}
        </div>
      )}
    </main>
  );
}
