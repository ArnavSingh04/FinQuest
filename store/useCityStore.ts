"use client";

import { create } from "zustand";

import type { CityMetrics, CityStructureInfo } from "@/types";

interface CityStore {
  cityMetrics: CityMetrics;
  hoveredStructure: CityStructureInfo | null;
  selectedStructure: CityStructureInfo | null;
  setCityMetrics: (cityMetrics: CityMetrics) => void;
  setHoveredStructure: (structure: CityStructureInfo | null) => void;
  setSelectedStructure: (structure: CityStructureInfo | null) => void;
}

const defaultCityMetrics: CityMetrics = {
  economyScore: 40,
  entertainment: 28,
  pollution: 18,
  growth: 24,
  infrastructure: 35,
  liquidity: 50,
  stability: 52,
  parks: 10,
  emergencyWarning: false,
};

export const useCityStore = create<CityStore>((set) => ({
  cityMetrics: defaultCityMetrics,
  hoveredStructure: null,
  selectedStructure: null,
  setCityMetrics: (cityMetrics) => set({ cityMetrics }),
  setHoveredStructure: (hoveredStructure) => set({ hoveredStructure }),
  setSelectedStructure: (selectedStructure) => set({ selectedStructure }),
}));
