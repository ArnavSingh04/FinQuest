"use client";

import { useState } from "react";
import { useGameStore } from "@/store/useGameStore";
import { getCityTier, getStreak } from "@/lib/cityLevel";

export function CityHeader() {
  const { cityName, cityState, transactions, setCityName } = useGameStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const tier = getCityTier(cityState.healthScore);
  const streak = getStreak(transactions);

  function save() {
    const name = draft.trim() || "My City";
    setCityName(name);
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">FinCity</p>
        {editing ? (
          <div className="flex items-center gap-2 mt-1">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
              onBlur={save}
              placeholder="City name…"
              className="rounded-xl border border-white/15 bg-slate-950/50 px-3 py-1 text-lg font-bold text-white outline-none focus:border-sky-400 w-48"
            />
          </div>
        ) : (
          <button
            onClick={() => { setDraft(cityName); setEditing(true); }}
            className="mt-1 text-2xl font-bold text-white hover:text-sky-300 transition text-left sm:text-3xl group flex items-center gap-2"
            title="Click to rename your city"
          >
            {cityName}
            <span className="text-xs text-slate-600 group-hover:text-slate-400 font-normal">✏️</span>
          </button>
        )}
      </div>

      {/* Tier badge */}
      <div className={`flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1`}>
        <span className="text-base">{tier.icon}</span>
        <span className={`text-xs font-bold ${tier.color}`}>{tier.name}</span>
      </div>

      {/* Streak */}
      {streak > 0 && (
        <div className="flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1">
          <span className="text-base">🔥</span>
          <span className="text-xs font-bold text-amber-400">{streak} day streak</span>
        </div>
      )}
    </div>
  );
}