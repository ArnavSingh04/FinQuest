"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/store/useGameStore";
import { useUIStore } from "@/store/useUIStore";

const SHORTCUTS: { id: "stats" | "quests" | "group" | "learn"; label: string; icon: string }[] = [
  { id: "stats", label: "City Stats", icon: "📊" },
  { id: "quests", label: "Quests", icon: "🎯" },
  { id: "group", label: "Group", icon: "👥" },
  { id: "learn", label: "Learn", icon: "📚" },
];

const DURATION_MS = 400;

function useAnimatedHealthScore(target: number) {
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    if (display === target) return;
    const start = display;
    const startTime = performance.now();
    let rafId: number;

    function tick(now: number) {
      const t = Math.min((now - startTime) / DURATION_MS, 1);
      const eased = t * (2 - t);
      setDisplay(Math.round(start + (target - start) * eased));
      if (t < 1) rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, display]);

  return display;
}

export function BottomActionCard() {
  const cityState = useGameStore((s) => s.cityState);
  const setActiveSheet = useUIStore((s) => s.setActiveSheet);
  const healthScore = useAnimatedHealthScore(cityState.healthScore);

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-30 px-3 pb-[max(12px,env(safe-area-inset-bottom))]"
      style={{ maxWidth: 390, margin: "0 auto" }}
    >
      <div
        className="rounded-[24px] bg-bg-elevated p-4 shadow-card"
        style={{ minHeight: 140, boxShadow: "0 2px 12px rgba(44,36,22,0.08)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-heading text-2xl font-normal text-text-primary">
              {healthScore}
            </span>
            <span className="text-sm text-text-muted">City Health</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveSheet("log")}
            className="touch-target min-h-[44px] min-w-[44px] rounded-full bg-accent-primary px-4 py-2 text-sm font-semibold text-white transition active:scale-[0.97] hover:bg-accent-primary-hover"
          >
            Log Spend
          </button>
        </div>
        <div className="mt-4 flex items-center justify-around">
          {SHORTCUTS.map(({ id, label, icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveSheet(id)}
              className="touch-target flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 text-text-muted transition active:scale-[0.97] hover:text-text-primary"
              aria-label={label}
            >
              <span className="text-xl" aria-hidden>
                {icon}
              </span>
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
