"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import { CityCanvas, CAMERA_PRESETS } from "@/components/city/CityFullscreen";
import { useGameStore } from "@/store/useGameStore";
import { decodeCityShare } from "@/lib/cityShare";

// ── Helpers ───────────────────────────────────────────────────────────────────

const WEATHER_EMOJI: Record<string, string> = {
  thriving: "✨", clear: "☀️", overcast: "⛅", rain: "🌧", storm: "⛈", destruction: "💥",
};

function healthColor(score: number): string {
  if (score > 70) return "#3DAB6A";
  if (score >= 40) return "#E8A020";
  return "#D94F3D";
}

function healthLabel(score: number): string {
  if (score > 70) return "Healthy";
  if (score >= 40) return "Growing";
  return "At Risk";
}

// ── Back Button ───────────────────────────────────────────────────────────────

function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push("/")}
      style={{
        position: "fixed",
        top: 16,
        left: 16,
        zIndex: 50,
        background: "#1C3A2E",
        color: "#F2EDE3",
        borderRadius: 999,
        padding: "10px 20px",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 14,
        fontWeight: 500,
        border: "none",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(28,58,46,0.3)",
        whiteSpace: "nowrap",
      }}
    >
      ← Back to my city
    </button>
  );
}

// ── Ratio Cards ───────────────────────────────────────────────────────────────

interface RatioCardProps {
  label: string;
  pct: number;
  description: string;
  bg: string;
  accent: string;
}

function RatioCard({ label, pct, description, bg, accent }: RatioCardProps) {
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
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: accent,
          margin: "0 0 4px",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 28,
          color: "#1C3A2E",
          lineHeight: 1,
          margin: "0 0 4px",
        }}
      >
        {Math.round(pct)}%
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

// ── Compare Bar ───────────────────────────────────────────────────────────────

function CompareBar({
  label, mine, theirs, accent,
}: {
  label: string; mine: number; theirs: number; accent: string;
}) {
  const diff = mine - theirs;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#4A6358" }}>
          {label}
        </span>
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            color: diff > 0 ? "#3DAB6A" : diff < 0 ? "#D94F3D" : "#8A9E94",
          }}
        >
          {diff > 0 ? `+${Math.round(diff)}%` : diff < 0 ? `${Math.round(diff)}%` : "Same"}
        </span>
      </div>
      <div
        style={{
          position: "relative",
          height: 8,
          borderRadius: 999,
          background: "#E8E0D0",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            height: "100%",
            borderRadius: 999,
            background: accent,
            opacity: 0.3,
            width: `${Math.round(theirs * 100)}%`,
          }}
        />
        <div
          style={{
            position: "absolute",
            height: "100%",
            borderRadius: 999,
            background: accent,
            width: `${Math.round(mine * 100)}%`,
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 2,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 10,
          color: "#8A9E94",
        }}
      >
        <span>Mine: {Math.round(mine * 100)}%</span>
        <span>Theirs: {Math.round(theirs * 100)}%</span>
      </div>
    </div>
  );
}

// ── Achievement Card ──────────────────────────────────────────────────────────

function AchievementCard({
  title, description, xp, unlocked,
}: {
  title: string; description: string; xp: number; unlocked: boolean;
}) {
  return (
    <div
      style={{
        background: unlocked ? "#FFFFFF" : "#F2EDE3",
        border: "1px solid #C8BFA8",
        borderRadius: 12,
        padding: "12px 14px",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        opacity: unlocked ? 1 : 0.75,
      }}
    >
      <div style={{ fontSize: 22, lineHeight: 1.2, flexShrink: 0 }}>
        {unlocked ? "🏅" : "🔒"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 15,
            color: unlocked ? "#1C3A2E" : "#8A9E94",
            margin: "0 0 2px",
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: unlocked ? "#4A6358" : "#8A9E94",
            margin: "0 0 6px",
            lineHeight: 1.4,
          }}
        >
          {description}
        </p>
        <div style={{ display: "flex", gap: 6 }}>
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
            +{xp} XP
          </span>
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              background: unlocked ? "#3DAB6A" : "#E8E0D0",
              color: unlocked ? "#FFFFFF" : "#8A9E94",
              padding: "2px 8px",
              borderRadius: 999,
            }}
          >
            {unlocked ? "Unlocked" : "Locked"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Metric Card ───────────────────────────────────────────────────────────────

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #C8BFA8",
        borderRadius: 12,
        padding: "14px 16px",
        flex: 1,
        minWidth: 0,
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#8A9E94",
          margin: "0 0 4px",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 24,
          color: "#1C3A2E",
          margin: 0,
          lineHeight: 1,
        }}
      >
        {value}
      </p>
    </div>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────────────────

const CARD: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #C8BFA8",
  borderRadius: 16,
  padding: "20px",
  boxShadow: "0 2px 12px rgba(44,36,22,0.06)",
};

// ── Main content ──────────────────────────────────────────────────────────────

function SharedCityContent() {
  const params = useSearchParams();
  const code = params.get("c") ?? "";
  const { cityState: myCity, proportions: myProps, loadFromStorage } = useGameStore();
  const [preset, setPreset] = useState<typeof CAMERA_PRESETS[number] | null>(null);

  useEffect(() => { loadFromStorage(); }, [loadFromStorage]);

  const shared = useMemo(() => decodeCityShare(code), [code]);

  if (!shared) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#F2EDE3",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          textAlign: "center",
        }}
      >
        <BackButton />
        <p style={{ fontSize: 48, marginBottom: 12 }}>⚠️</p>
        <h1
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 24,
            color: "#1C3A2E",
            margin: "0 0 8px",
          }}
        >
          Invalid city link
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#4A6358" }}>
          This share code is broken or expired.
        </p>
      </main>
    );
  }

  const override = { cityState: { ...shared.city, budgetUsed: 0 }, proportions: shared.props };
  const healthDiff = myCity.healthScore - shared.city.healthScore;
  const theirHealth = shared.city.healthScore;

  // Derive achievements from city state
  const achievements = [
    {
      title: "First Steps",
      description: "Log your first transaction",
      xp: 50,
      unlocked: true,
    },
    {
      title: "Balanced Budget",
      description: "Achieve the 50/30/20 spending split",
      xp: 150,
      unlocked:
        shared.props.needs >= 0.45 &&
        shared.props.wants <= 0.32 &&
        shared.props.investments >= 0.18,
    },
    {
      title: "Investor Mindset",
      description: "Keep investments above 20%",
      xp: 200,
      unlocked: shared.props.investments >= 0.2,
    },
    {
      title: "Clean City",
      description: "Keep treats below 5% for a month",
      xp: 100,
      unlocked: shared.props.treats < 0.05,
    },
    {
      title: "Thriving Metropolis",
      description: "Reach a health score above 70",
      xp: 300,
      unlocked: theirHealth > 70,
    },
    {
      title: "City Builder",
      description: "Unlock a reward building through a quest",
      xp: 250,
      unlocked: false,
    },
  ];
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <>
      <BackButton />

      <main
        style={{
          minHeight: "100vh",
          background: "#F2EDE3",
          padding: "72px 16px 48px",
          maxWidth: 960,
          margin: "0 auto",
        }}
      >
        {/* ── Member header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          <h1
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 26,
              color: "#1C3A2E",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Visiting {shared.name}&apos;s City
          </h1>
          <span
            style={{
              background: healthColor(theirHealth),
              color: "#FFFFFF",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              padding: "4px 12px",
              borderRadius: 999,
              whiteSpace: "nowrap",
            }}
          >
            {theirHealth} · {healthLabel(theirHealth)}
          </span>
        </div>

        {/* ── Spending ratio cards ── */}
        <div
          style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}
        >
          <RatioCard
            label="Needs Ratio"
            pct={shared.props.needs * 100}
            description="Housing & essentials"
            bg="#EBF2FC"
            accent="#3B7DD8"
          />
          <RatioCard
            label="Wants Ratio"
            pct={shared.props.wants * 100}
            description="Lifestyle & dining"
            bg="#FDF3E0"
            accent="#E8A020"
          />
          <RatioCard
            label="Treat Ratio"
            pct={shared.props.treats * 100}
            description="Impulse & luxuries"
            bg="#FCECEA"
            accent="#D94F3D"
          />
          <RatioCard
            label="Invest Ratio"
            pct={shared.props.investments * 100}
            description="Savings & investments"
            bg="#E8F7EE"
            accent="#3DAB6A"
          />
        </div>

        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "minmax(0, 1.5fr) minmax(0, 1fr)",
          }}
        >
          {/* ── Left column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Camera presets */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {CAMERA_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setPreset(preset?.label === p.label ? null : p)}
                  style={{
                    borderRadius: 10,
                    padding: "6px 12px",
                    fontSize: 12,
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "1px solid",
                    transition: "all 160ms ease",
                    background:
                      preset?.label === p.label ? "#1C3A2E" : "#FFFFFF",
                    color:
                      preset?.label === p.label ? "#F2EDE3" : "#4A6358",
                    borderColor:
                      preset?.label === p.label ? "#1C3A2E" : "#C8BFA8",
                  }}
                >
                  {p.icon} {p.label}
                </button>
              ))}
            </div>

            {/* City canvas */}
            <div
              style={{
                overflow: "hidden",
                borderRadius: 20,
                border: "1px solid #C8BFA8",
                boxShadow: "0 4px 20px rgba(28,58,46,0.1)",
                height: 360,
              }}
            >
              <CityCanvas className="w-full h-full" preset={preset} override={override} />
            </div>

            {/* Bottom metric cards */}
            <div style={{ display: "flex", gap: 10 }}>
              <MetricCard label="Health Score" value={theirHealth} />
              <MetricCard
                label="Weather"
                value={WEATHER_EMOJI[shared.city.weather] ?? shared.city.weather}
              />
              <MetricCard
                label="Population"
                value={`${shared.city.population * 100}k`}
              />
              <MetricCard
                label="Restaurants"
                value={shared.city.restaurantCount}
              />
            </div>

            {/* Latest Insight card */}
            <div style={CARD}>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#8A9E94",
                  margin: "0 0 8px",
                }}
              >
                Latest Insight
              </p>
              <h3
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: 20,
                  color: "#1C3A2E",
                  margin: "0 0 8px",
                }}
              >
                Financial coach summary
              </h3>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  color: "#4A6358",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {theirHealth > 70
                  ? `${shared.name} has a well-balanced city. Strong investments at ${Math.round(shared.props.investments * 100)}% are driving growth.`
                  : theirHealth >= 40
                  ? `${shared.name}&apos;s city is growing steadily. Boosting investments above 20% would accelerate progress.`
                  : `${shared.name}&apos;s city needs attention. Reducing treat spending and increasing needs coverage will help.`}
              </p>
            </div>
          </div>

          {/* ── Right column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Head-to-head comparison */}
            <div style={CARD}>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#8A9E94",
                  margin: "0 0 16px",
                }}
              >
                Head to Head
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <p
                    style={{
                      fontFamily: "'DM Serif Display', serif",
                      fontSize: 36,
                      color: "#1C3A2E",
                      margin: 0,
                      lineHeight: 1,
                    }}
                  >
                    {myCity.healthScore}
                  </p>
                  <p
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#3DAB6A",
                      margin: "4px 0 0",
                    }}
                  >
                    Your score
                  </p>
                </div>

                <div style={{ textAlign: "center", padding: "0 12px" }}>
                  <p
                    style={{
                      fontFamily: "'DM Serif Display', serif",
                      fontSize: 20,
                      color: healthDiff > 0 ? "#3DAB6A" : healthDiff < 0 ? "#D94F3D" : "#8A9E94",
                      margin: 0,
                    }}
                  >
                    {healthDiff > 0 ? `+${healthDiff}` : healthDiff}
                  </p>
                  <p
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 10,
                      color: "#8A9E94",
                      margin: "2px 0 0",
                    }}
                  >
                    difference
                  </p>
                </div>

                <div style={{ textAlign: "center" }}>
                  <p
                    style={{
                      fontFamily: "'DM Serif Display', serif",
                      fontSize: 36,
                      color: "#8A9E94",
                      margin: 0,
                      lineHeight: 1,
                    }}
                  >
                    {theirHealth}
                  </p>
                  <p
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#8A9E94",
                      margin: "4px 0 0",
                    }}
                  >
                    Their score
                  </p>
                </div>
              </div>

              <hr style={{ border: "none", borderTop: "1px solid #E8E0D0", margin: "0 0 16px" }} />

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <CompareBar label="🏠 Needs"  mine={myProps.needs}       theirs={shared.props.needs}       accent="#3B7DD8" />
                <CompareBar label="🍕 Wants"  mine={myProps.wants}       theirs={shared.props.wants}       accent="#E8A020" />
                <CompareBar label="🛍 Treats" mine={myProps.treats}      theirs={shared.props.treats}      accent="#D94F3D" />
                <CompareBar label="📈 Invest" mine={myProps.investments} theirs={shared.props.investments} accent="#3DAB6A" />
              </div>

              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 10,
                  color: "#8A9E94",
                  textAlign: "center",
                  margin: "12px 0 0",
                }}
              >
                Solid bar = yours · Faded = theirs
              </p>
            </div>

            {/* Verdict */}
            <div
              style={{
                ...CARD,
                borderColor: healthDiff >= 0 ? "#3DAB6A" : "#D94F3D",
                borderWidth: 1,
              }}
            >
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#8A9E94",
                  margin: "0 0 8px",
                }}
              >
                Verdict
              </p>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  color: "#4A6358",
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {healthDiff > 5
                  ? "Your city is healthier! Keep up the discipline."
                  : healthDiff < -5
                  ? "Their city is doing better. Check their spending mix for inspiration."
                  : "You're neck and neck — healthy competition!"}
              </p>
            </div>

            {/* Achievements */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#8A9E94",
                    margin: 0,
                  }}
                >
                  Achievements
                </p>
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: "#1C3A2E",
                    margin: 0,
                  }}
                >
                  {unlockedCount}/{achievements.length} unlocked
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {achievements.map((a) => (
                  <AchievementCard key={a.title} {...a} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

// ── Page export ───────────────────────────────────────────────────────────────

export default function SharedCityPage() {
  return (
    <Suspense
      fallback={
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
            Loading city…
          </p>
        </main>
      }
    >
      <SharedCityContent />
    </Suspense>
  );
}
