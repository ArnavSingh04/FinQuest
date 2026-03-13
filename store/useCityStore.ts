"use client";

import { create } from "zustand";

import type { CityMetrics } from "@/types";

interface CityStore {
  cityMetrics: CityMetrics;
  setCityMetrics: (cityMetrics: CityMetrics) => void;
}

const defaultCityMetrics: CityMetrics = {
  housing: 35,
  entertainment: 28,
  pollution: 18,
  growth: 24,
};

export const useCityStore = create<CityStore>((set) => ({
  cityMetrics: defaultCityMetrics,
  setCityMetrics: (cityMetrics) => set({ cityMetrics }),
}));
