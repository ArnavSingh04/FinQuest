"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useCityStore } from "@/store/useCityStore";
import { useWorldStore } from "@/store/useWorldStore";

function copyToClipboard(text: string) {
  if (typeof navigator === "undefined") return;
  navigator.clipboard.writeText(text).catch(() => {
    // ignore
  });
}

export function WorldPanel() {
  const cityMetrics = useCityStore((state) => state.cityMetrics);
  const initWorld = useWorldStore((state) => state.init);
  const exportCurrentWorldCode = useWorldStore((state) => state.exportCurrentWorldCode);
  const joinWorld = useWorldStore((state) => state.joinWorld);
  const leaveWorld = useWorldStore((state) => state.leaveWorld);
  const setActiveWorld = useWorldStore((state) => state.setActiveWorld);
  const updateMyMetrics = useWorldStore((state) => state.updateMyMetrics);
  const worldId = useWorldStore((state) => state.worldId);
  const worldName = useWorldStore((state) => state.worldName);
  const members = useWorldStore((state) => state.members);
  const availableWorlds = useWorldStore((state) => state.availableWorlds);

  const [inviteCode, setInviteCode] = useState("");
  const [joinStatus, setJoinStatus] = useState<string | null>(null);

  useEffect(() => {
    initWorld();
  }, [initWorld]);

  useEffect(() => {
    updateMyMetrics(cityMetrics);
  }, [cityMetrics, updateMyMetrics]);

  const [inviteText, setInviteText] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const code = exportCurrentWorldCode();
    setInviteText(code);
  }, [exportCurrentWorldCode]);

  return (
    <section className="glass-card mt-6 rounded-[2rem] p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
            World
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {worldName || "My World"}
          </h2>
          <p className="mt-3 text-sm text-slate-300">
            Choose which world you’re viewing and share its code with friends. Paste codes back to sync updates.
          </p>

          {availableWorlds.length > 0 ? (
            <div className="mt-4 flex items-center gap-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Viewing
              </label>
              <select
                value={worldId}
                onChange={(event) => setActiveWorld(event.target.value)}
                className="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
              >
                {availableWorlds.map((world) => (
                  <option key={world.id} value={world.id}>
                    {world.name} ({world.memberCount})
                    {world.id ? ` — ${world.id.slice(0, 6)}` : ""}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <Link
            href="/world"
            className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-white/10 transition hover:bg-white/20"
          >
            View world in 3D
          </Link>

          <button
            type="button"
            className="rounded-2xl bg-sky-400/30 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-white/10 transition hover:bg-sky-400/40"
            onClick={() => {
              copyToClipboard(inviteText);
            }}
          >
            Copy invite code
          </button>

          <button
            type="button"
            className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-white"
            onClick={() => leaveWorld()}
          >
            Leave world
          </button>
        </div>
      </div>

      <div className="mt-6 sm:flex sm:items-center sm:gap-3">
        <input
          value={inviteCode}
          onChange={(event) => setInviteCode(event.target.value)}
          placeholder="Paste world code to join or sync"
          className="w-full rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
        />
        <button
          type="button"
          className="mt-3 w-full rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 sm:mt-0 sm:w-auto"
          onClick={() => {
            setJoinStatus(null);
            const result = joinWorld(inviteCode.trim());
            if (!result.success) {
              setJoinStatus(result.message ?? "Unable to join/sync world.");
            } else {
              const action = result.action === "synced" ? "World synced!" : "Joined world!";
              setJoinStatus(action);
              setInviteCode("");
            }
          }}
        >
          Join/Sync world
        </button>
      </div>

      {joinStatus ? (
        <p className="mt-3 text-sm text-slate-300">{joinStatus}</p>
      ) : null}

      <div className="mt-6 grid gap-3">
        {members.map((member) => (
          <div
            key={member.id}
            className={`rounded-2xl border border-white/10 p-4 ${
              member.isYou ? "bg-sky-950/40" : "bg-slate-950/20"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">
                {member.isYou ? "You" : `Player ${member.id.slice(0, 6)}`}
              </p>
              <p className="text-xs text-slate-400">
                Updated {new Date(member.lastUpdated).toLocaleString()}
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-200">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Housing
                </p>
                <p className="mt-1 text-base font-semibold text-white">
                  {member.cityMetrics.housing}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Entertainment
                </p>
                <p className="mt-1 text-base font-semibold text-white">
                  {member.cityMetrics.entertainment}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Pollution
                </p>
                <p className="mt-1 text-base font-semibold text-white">
                  {member.cityMetrics.pollution}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Growth
                </p>
                <p className="mt-1 text-base font-semibold text-white">
                  {member.cityMetrics.growth}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
