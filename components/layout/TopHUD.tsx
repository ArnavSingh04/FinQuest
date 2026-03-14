"use client";

import { useGameStore } from "@/store/useGameStore";

function pollutionFromWeather(weather: string): number {
  const map: Record<string, number> = {
    destruction: 90,
    storm: 70,
    rain: 50,
    overcast: 30,
    clear: 10,
    thriving: 0,
  };
  return map[weather] ?? 30;
}

export function TopHUD() {
  const cityName = useGameStore((s) => s.cityName);
  const cityState = useGameStore((s) => s.cityState);
  const healthScore = cityState.healthScore;
  const economy = healthScore;
  const pollution = pollutionFromWeather(cityState.weather);
  const growth = Math.min(100, cityState.population * 10);

  return (
    <header
      className="absolute left-0 right-0 top-0 z-20 flex flex-col pt-[env(safe-area-inset-top)]"
      style={{ maxWidth: 390, margin: "0 auto", backgroundColor: "#1C3A2E" }}
    >
      <div className="flex h-[52px] items-center justify-between px-4 backdrop-blur-md">
        <span className="font-heading text-lg font-normal" style={{ color: "#F2EDE3" }}>
          FinQuest
        </span>
        <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
          <span className="text-sm font-medium" style={{ color: "#F2EDE3" }}>
            {cityName} · {healthScore}
          </span>
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{
              backgroundColor:
                healthScore >= 70
                  ? "var(--cat-invest)"
                  : healthScore >= 40
                    ? "var(--cat-want)"
                    : "var(--cat-treat)",
            }}
            aria-hidden
          />
        </div>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
          style={{ backgroundColor: "#C17B3F", color: "#F2EDE3" }}
          aria-label="Profile"
        >
          {cityName[0]?.toUpperCase() ?? "?"}
        </div>
      </div>
      <div className="mt-1 flex justify-center gap-2 px-4">
        <span className="rounded-full px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: "rgba(28, 58, 46, 0.88)", color: "#F2EDE3" }}>
          Economy {economy}
        </span>
        <span className="rounded-full px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: "rgba(28, 58, 46, 0.88)", color: "#F2EDE3" }}>
          Pollution {pollution}
        </span>
        <span className="rounded-full px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: "rgba(28, 58, 46, 0.88)", color: "#F2EDE3" }}>
          Growth {growth}
        </span>
      </div>
    </header>
  );
}
