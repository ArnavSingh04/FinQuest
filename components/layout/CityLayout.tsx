"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { CityScene } from "@/components/city/CityScene";
import { TopHUD } from "@/components/layout/TopHUD";
import { BottomActionCard } from "@/components/layout/BottomActionCard";
import { BottomSheet, LOG_SHEET_TRANSITION } from "@/components/layout/BottomSheet";
import { useGameStore } from "@/store/useGameStore";
import { useUIStore } from "@/store/useUIStore";

import { LogSheetContent } from "@/components/sheets/LogSheetContent";
import { HistorySheetContent } from "@/components/sheets/HistorySheetContent";
import { LearnSheetContent } from "@/components/sheets/LearnSheetContent";
import { GroupsSheetContent } from "@/components/sheets/GroupsSheetContent";
import { StatsSheetContent } from "@/components/sheets/StatsSheetContent";
import { QuestsSheetContent } from "@/components/sheets/QuestsSheetContent";

const SHEET_TITLES: Record<NonNullable<ReturnType<typeof useUIStore.getState>["activeSheet"]>, string> = {
  log: "Log Spend",
  history: "History",
  learn: "Learn",
  group: "Groups",
  stats: "City Stats",
  quests: "Quests",
};

/** Brief pulse/ripple overlay on the city canvas (e.g. after logging a transaction). Non-city: overlay only. */
function CityPulseOverlay() {
  const cityPulseTrigger = useUIStore((s) => s.cityPulseTrigger);
  if (cityPulseTrigger === 0) return null;
  return (
    <motion.div
      key={cityPulseTrigger}
      className="pointer-events-none fixed inset-0 z-25 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0, 0.2, 0],
        scale: [0.5, 1.8, 2],
        x: [0, -3, 3, -2, 2, 0],
      }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div
        className="h-32 w-32 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(193,123,63,0.25) 0%, transparent 70%)",
          boxShadow: "0 0 80px 40px rgba(193,123,63,0.1)",
        }}
      />
    </motion.div>
  );
}

function SheetContent() {
  const activeSheet = useUIStore((s) => s.activeSheet);

  switch (activeSheet) {
    case "log":
      return <LogSheetContent />;
    case "history":
      return <HistorySheetContent />;
    case "learn":
      return <LearnSheetContent />;
    case "group":
      return <GroupsSheetContent />;
    case "stats":
      return <StatsSheetContent />;
    case "quests":
      return <QuestsSheetContent />;
    default:
      return null;
  }
}

export function CityLayout() {
  const activeSheet = useUIStore((s) => s.activeSheet);

  useEffect(() => {
    const state = useGameStore.getState();
    if (state.transactions.length === 0) {
      state.loadFromStorage();
    }
  }, []);

  return (
    <div className="city-layout-root relative h-screen w-full overflow-hidden bg-bg-base">
      {/* 1. Persistent city layer — full viewport, behind everything (full-bleed via .city-canvas-fullbleed in globals) */}
      <div className="absolute inset-0 z-0 city-canvas-fullbleed">
        <CityScene height="h-full" />
      </div>

      {/* Bottom vignette so UI is readable over the city */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-40"
        style={{
          background: "linear-gradient(to top, rgba(245,240,232,0.95), transparent)",
        }}
      />

      {/* 2. Top HUD — full width; desktop padding via globals */}
      <TopHUD />

      {/* 3. Bottom action card — mobile: full width 12px margins; desktop: max-w 480px centered (see globals.css) */}
      <div className="bottom-action-card-wrapper absolute bottom-0 left-0 right-0 z-30 md:fixed md:bottom-6 md:left-1/2 md:right-auto md:max-w-[480px] md:w-full md:-translate-x-1/2">
        <BottomActionCard />
      </div>

      {/* 4. Bottom sheets (overlay + panel) */}
      <AnimatePresence mode="wait">
        {activeSheet != null && (
          <BottomSheet
            key={activeSheet}
            title={activeSheet === "log" ? "" : SHEET_TITLES[activeSheet]}
            maxHeight={
              activeSheet === "log"
                ? "75vh"
                : activeSheet === "stats" || activeSheet === "group"
                  ? "80vh"
                  : "85vh"
            }
            transition={activeSheet === "log" ? LOG_SHEET_TRANSITION : undefined}
          >
            <SheetContent />
          </BottomSheet>
        )}
      </AnimatePresence>

      {/* City pulse overlay (after successful log) — non-city overlay only */}
      <CityPulseOverlay />
    </div>
  );
}
