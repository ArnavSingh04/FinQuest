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
  const activeSheet = useUIStore((s) => s.activeSheet);
  const healthScore = useAnimatedHealthScore(cityState.healthScore);

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-30 px-3 pb-[max(12px,env(safe-area-inset-bottom))]"
      style={{ maxWidth: 390, margin: "0 auto" }}
    >
      <div
        className="rounded-[24px] p-4"
        style={{ minHeight: 140, backgroundColor: "#1C3A2E", boxShadow: "0 2px 12px rgba(44,36,22,0.08)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-heading text-2xl font-normal" style={{ color: "#F2EDE3" }}>
              {healthScore}
            </span>
            <span className="text-sm" style={{ color: "#8ABF9E" }}>City Health</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveSheet("log")}
            className="touch-target min-h-[44px] min-w-[44px] rounded-full px-4 py-2 text-sm font-semibold text-white transition active:scale-[0.97] hover:opacity-90"
            style={{ backgroundColor: "#C17B3F" }}
          >
            Log Spend
          </button>
        </div>
        <div className="mt-4 flex items-center justify-around">
          {SHORTCUTS.map(({ id, label, icon }) => {
            const isActive = activeSheet === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveSheet(id)}
                className="touch-target flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 transition active:scale-[0.97]"
                style={{ color: isActive ? "#F2EDE3" : "#8ABF9E" }}
                aria-label={label}
              >
                <span className="text-xl" aria-hidden>{icon}</span>
                {isActive && (
                  <span className="h-0.5 w-2 rounded-full" style={{ backgroundColor: "#C17B3F" }} aria-hidden />
                )}
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
