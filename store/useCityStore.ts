"use client";

import { create } from "zustand";

import type { CityMetrics } from "@/types";

interface CityStore {
  cityMetrics: CityMetrics;
  heightMultiplier: number;
  setCityMetrics: (cityMetrics: CityMetrics) => void;
  setHeightMultiplier: (multiplier: number) => void;
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
  setCityMetrics: (cityMetrics) => set({ cityMetrics }),
  setHeightMultiplier: (multiplier) => set({ heightMultiplier: multiplier }),
}));
