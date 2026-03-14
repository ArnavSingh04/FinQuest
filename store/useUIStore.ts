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
  /** Timestamp to trigger city canvas pulse (e.g. after logging a transaction). */
  cityPulseTrigger: number;
  triggerCityPulse: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  activeSheet: null,
  setActiveSheet: (activeSheet) => set({ activeSheet }),
  cityPulseTrigger: 0,
  triggerCityPulse: () => set({ cityPulseTrigger: Date.now() }),
}));
