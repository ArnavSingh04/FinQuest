"use client";

import { motion } from "framer-motion";

import type { CityMetrics, CityStructureInfo } from "@/types";

interface CityHUDProps {
  cityMetrics: CityMetrics;
  hoveredStructure: CityStructureInfo | null;
  selectedStructure: CityStructureInfo | null;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export function CityHUD({
  cityMetrics,
  hoveredStructure,
  selectedStructure,
  isFullscreen,
  onToggleFullscreen,
}: CityHUDProps) {
  const activeStructure = selectedStructure ?? hoveredStructure;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-4">
      <div className="grid gap-3 sm:grid-cols-[repeat(3,minmax(0,1fr))_auto]">
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-sky-300">
            Economy Score
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {cityMetrics.economyScore}
          </p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-sky-300">
            Pollution Level
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {cityMetrics.pollution}
          </p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-sky-300">
            City Growth
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {cityMetrics.growth}
          </p>
        </div>
        <div className="pointer-events-auto flex items-start justify-end">
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="glass-card rounded-2xl px-4 py-3 text-sm font-medium text-white"
          >
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>
        </div>
      </div>

      {activeStructure ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card mt-4 max-w-sm rounded-2xl p-4"
        >
          <p className="text-sm font-semibold text-white">{activeStructure.title}</p>
          <p className="mt-1 text-sm text-sky-300">
            {activeStructure.category} · score {activeStructure.metricValue}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {selectedStructure
              ? "Selected building details are pinned in the side panel."
              : activeStructure.description}
          </p>
        </motion.div>
      ) : null}
    </div>
  );
}
