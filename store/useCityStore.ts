"use client";

import { create } from "zustand";

import type { CityMetrics } from "@/types";
import type { RawCityFinanceMetrics } from "@/lib/cityFinanceModel";

interface CityStore {
  cityMetrics: CityMetrics;
  financeMetrics: RawCityFinanceMetrics;
  heightMultiplier: number;
  skyMode: "day" | "night";
  setCityMetrics: (cityMetrics: CityMetrics) => void;
  setFinanceMetrics: (metrics: RawCityFinanceMetrics) => void;
  setHeightMultiplier: (value: number) => void;
  setSkyMode: (mode: "day" | "night") => void;
}

const defaultCityMetrics: CityMetrics = {
  housing: 35,
  entertainment: 28,
  pollution: 18,
  growth: 24,
};

const defaultFinanceMetrics: RawCityFinanceMetrics = {
  needs: 35,
  wants: 28,
  investments: 24,
  assets: 18,
};

export const useCityStore = create<CityStore>((set) => ({
  cityMetrics: defaultCityMetrics,
  financeMetrics: defaultFinanceMetrics,
  heightMultiplier: 1,
  skyMode: "day",
  setCityMetrics: (cityMetrics) => set({ cityMetrics }),
  setFinanceMetrics: (metrics) => set({ financeMetrics: metrics }),
  setHeightMultiplier: (value) => set({ heightMultiplier: value }),
  setSkyMode: (mode) => set({ skyMode: mode }),
}));
