"use client";

import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";

import { CityScene } from "@/components/city/CityScene";
import { TopHUD } from "@/components/layout/TopHUD";
import { BottomActionCard } from "@/components/layout/BottomActionCard";
import { BottomSheet } from "@/components/layout/BottomSheet";
import { useGameStore } from "@/store/useGameStore";
import { useUIStore } from "@/store/useUIStore";

import { LogSheetContent } from "@/components/sheets/LogSheetContent";
import { HistorySheetContent } from "@/components/sheets/HistorySheetContent";
import { LearnSheetContent } from "@/components/sheets/LearnSheetContent";
import { GroupsSheetContent } from "@/components/sheets/GroupsSheetContent";
import { StatsSheetContent } from "@/components/sheets/StatsSheetContent";

const SHEET_TITLES: Record<NonNullable<ReturnType<typeof useUIStore.getState>["activeSheet"]>, string> = {
  log: "Log Spend",
  history: "History",
  learn: "Learn",
  group: "Groups",
  stats: "City Stats",
  quests: "Quests",
};

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
      return (
        <div className="px-4 py-8 text-center text-text-muted">
          Quests coming soon.
        </div>
      );
    default:
      return null;
  }
}

export function CityLayout() {
  const activeSheet = useUIStore((s) => s.activeSheet);
  const loadFromStorage = useGameStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <div
      className="relative h-screen w-full overflow-hidden bg-bg-base"
      style={{ maxWidth: 390, margin: "0 auto" }}
    >
      {/* 1. Persistent city layer — full viewport, behind everything */}
      <div className="absolute inset-0 z-0">
        <CityScene embedded={false} />
      </div>

      {/* Bottom vignette so UI is readable over the city */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-40"
        style={{
          background: "linear-gradient(to top, rgba(245,240,232,0.95), transparent)",
        }}
      />

      {/* 2. Top HUD */}
      <TopHUD />

      {/* 3. Bottom action card */}
      <BottomActionCard />

      {/* 4. Bottom sheets (overlay + panel) */}
      <AnimatePresence mode="wait">
        {activeSheet != null && (
          <BottomSheet
            key={activeSheet}
            title={SHEET_TITLES[activeSheet]}
            maxHeight="85vh"
          >
            <SheetContent />
          </BottomSheet>
        )}
      </AnimatePresence>
    </div>
  );
}
