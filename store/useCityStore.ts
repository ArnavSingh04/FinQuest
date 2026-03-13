"use client";

import { create } from "zustand";

import type { CityMetrics } from "@/types";

interface CityStore {
  cityMetrics: CityMetrics;
  heightMultiplier: number;
  needsBoostVersion: number;
  skyMode: "day" | "night";
  setCityMetrics: (cityMetrics: CityMetrics) => void;
  setHeightMultiplier: (multiplier: number) => void;
  increaseHeightMultiplier: (delta: number) => void;
  incrementNeedsBoostVersion: () => void;
  setSkyMode: (mode: "day" | "night") => void;
}

const defaultCityMetrics: CityMetrics = {
  housing: 35,
  entertainment: 28,
  pollution: 18,
  growth: 24,
};

export const useCityStore = create<CityStore>((set) => ({
  cityMetrics: defaultCityMetrics,
  heightMultiplier: 1,
  needsBoostVersion: 0,
  skyMode: "day",
  setCityMetrics: (cityMetrics) => set({ cityMetrics }),
  setHeightMultiplier: (multiplier) => set({ heightMultiplier: multiplier }),
  increaseHeightMultiplier: (delta) =>
    set((state) => ({ heightMultiplier: state.heightMultiplier + delta })),
  incrementNeedsBoostVersion: () =>
    set((state) => ({ needsBoostVersion: state.needsBoostVersion + 1 })),
  setSkyMode: (mode) => set({ skyMode: mode }),
}));
