"use client";

import { create } from "zustand";

export type SheetId =
  | null
  | "stats"
  | "history"
  | "group"
  | "learn"
  | "quests"
  | "log";

interface UIStore {
  activeSheet: SheetId;
  setActiveSheet: (sheet: SheetId) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  activeSheet: null,
  setActiveSheet: (activeSheet) => set({ activeSheet }),
}));
