"use client";

import { create } from "zustand";

import type { CityMetrics } from "@/types";
import { defaultCityMetrics } from "@/lib/worlds";

interface CityStore {
  cityMetrics: CityMetrics;
  setCityMetrics: (cityMetrics: CityMetrics) => void;
}

export const useCityStore = create<CityStore>((set) => ({
  cityMetrics: defaultCityMetrics,
  setCityMetrics: (cityMetrics) => set({ cityMetrics }),
}));
