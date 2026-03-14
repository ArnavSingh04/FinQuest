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
      style={{ maxWidth: 390, margin: "0 auto" }}
    >
      <div className="flex h-[52px] items-center justify-between px-4 backdrop-blur-md">
        <span className="font-heading text-lg font-normal text-text-primary">
          FinQuest
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">
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
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-primary text-sm font-semibold text-white"
          aria-label="Profile"
        >
          {cityName[0]?.toUpperCase() ?? "?"}
        </div>
      </div>
      <div className="mt-1 flex justify-center gap-2 px-4">
        <span className="rounded-full bg-bg-elevated px-3 py-1.5 text-xs font-medium text-text-secondary shadow-card">
          Economy {economy}
        </span>
        <span className="rounded-full bg-bg-elevated px-3 py-1.5 text-xs font-medium text-text-secondary shadow-card">
          Pollution {pollution}
        </span>
        <span className="rounded-full bg-bg-elevated px-3 py-1.5 text-xs font-medium text-text-secondary shadow-card">
          Growth {growth}
        </span>
      </div>
    </header>
  );
}
