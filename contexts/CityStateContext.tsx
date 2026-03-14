"use client";

import { createContext, useContext } from "react";
import type { CityState, Proportions } from "@/types";

export interface CityStateOverride {
  cityState: CityState;
  proportions: Proportions;
}

export const CityStateContext = createContext<CityStateOverride | null>(null);

export function useCityStateOverride() {
  return useContext(CityStateContext);
}