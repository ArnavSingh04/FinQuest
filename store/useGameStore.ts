"use client";

import { useEffect, useReducer } from "react";
import { create } from "zustand";

import { generateCityState, defaultCityState } from "@/lib/cityEngine";
import { calculateSpendingRatios } from "@/lib/financeEngine";
import type { CityState, Proportions, RewardBuilding, Transaction } from "@/types";

const defaultProportions: Proportions = { needs: 0, wants: 0, treats: 0, investments: 0 };

export interface GameStore {
  transactions: Transaction[];
  proportions: Proportions;
  cityState: CityState;
  advisorMessage: string;
  isAdvisorLoading: boolean;
  monthlyIncome: number;
  cityName: string;
  rewardBuildings: RewardBuilding[];
  addTransaction: (t: Omit<Transaction, "id" | "created_at">) => Transaction[];
  clearAll: () => void;
  loadFromStorage: () => void;
  setAdvisorMessage: (msg: string) => void;
  setAdvisorLoading: (loading: boolean) => void;
  setMonthlyIncome: (income: number) => void;
  setCityName: (name: string) => void;
  unlockRewardBuilding: (building: RewardBuilding) => void;
  clearRewardBuildings: () => void;
}

function persist(key: string, value: unknown) {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

function ratiosToProportions(
  ratios: ReturnType<typeof calculateSpendingRatios>,
): Proportions {
  return {
    needs: ratios.needs_ratio,
    wants: ratios.wants_ratio,
    treats: ratios.treat_ratio,
    investments: ratios.invest_ratio,
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  transactions: [],
  proportions: defaultProportions,
  cityState: defaultCityState,
  advisorMessage: "Log a transaction and your city will come to life.",
  isAdvisorLoading: false,
  monthlyIncome: 0,
  cityName: "My City",
  rewardBuildings: [],

  addTransaction: (incoming) => {
    const tx: Transaction = {
      ...incoming,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    const newTxs = [...get().transactions, tx];
    const proportions = ratiosToProportions(calculateSpendingRatios(newTxs));
    const totalSpend = newTxs.reduce((s, t) => s + t.amount, 0);
    const cityState = generateCityState(proportions, get().monthlyIncome, totalSpend);

    persist("fq-transactions", newTxs);
    persist("fq-proportions", proportions);
    persist("fq-city-state", cityState);

    set({ transactions: newTxs, proportions, cityState });
    return newTxs;
  },

  clearAll: () => {
    ["fq-transactions", "fq-proportions", "fq-city-state", "fq-advisor", "fq-reward-buildings"].forEach((k) => {
      if (typeof window !== "undefined") localStorage.removeItem(k);
    });
    set({
      transactions: [],
      proportions: defaultProportions,
      cityState: defaultCityState,
      advisorMessage: "Log a transaction and your city will come to life.",
      rewardBuildings: [],
    });
  },

  loadFromStorage: () => {
    if (typeof window === "undefined") return;
    try {
      const txRaw      = localStorage.getItem("fq-transactions");
      const pRaw       = localStorage.getItem("fq-proportions");
      const csRaw      = localStorage.getItem("fq-city-state");
      const msgRaw     = localStorage.getItem("fq-advisor");
      const incomeRaw  = localStorage.getItem("fq-income");
      const nameRaw    = localStorage.getItem("fq-city-name");
      const rbRaw      = localStorage.getItem("fq-reward-buildings");

      const updates: Partial<GameStore> = {};
      if (txRaw)     updates.transactions   = JSON.parse(txRaw);
      if (pRaw)      updates.proportions    = JSON.parse(pRaw);
      if (csRaw)     updates.cityState      = JSON.parse(csRaw);
      if (msgRaw)    updates.advisorMessage = msgRaw;
      if (incomeRaw) updates.monthlyIncome  = JSON.parse(incomeRaw);
      if (nameRaw)   updates.cityName       = nameRaw;
      if (rbRaw)     updates.rewardBuildings = JSON.parse(rbRaw);
      set(updates);
    } catch {
      // ignore corrupt storage
    }
  },

  setAdvisorMessage: (msg) => {
    persist("fq-advisor", msg);
    set({ advisorMessage: msg });
  },

  setAdvisorLoading: (loading) => set({ isAdvisorLoading: loading }),

  setCityName: (name) => {
    if (typeof window !== "undefined") localStorage.setItem("fq-city-name", name);
    set({ cityName: name });
  },

  setMonthlyIncome: (income) => {
    persist("fq-income", income);
    // Recalculate city state with new income
    const { transactions, proportions } = get();
    const totalSpend = transactions.reduce((s, t) => s + t.amount, 0);
    const cityState = generateCityState(proportions, income, totalSpend);
    persist("fq-city-state", cityState);
    set({ monthlyIncome: income, cityState });
  },

  unlockRewardBuilding: (building) => {
    const next = [...get().rewardBuildings, building];
    persist("fq-reward-buildings", next);
    set({ rewardBuildings: next });
  },

  clearRewardBuildings: () => {
    if (typeof window !== "undefined") localStorage.removeItem("fq-reward-buildings");
    set({ rewardBuildings: [] });
  },
}));

/** Use inside R3F Canvas so store updates trigger re-renders. */
export function useGameStoreInCanvas<T>(selector: (s: GameStore) => T): T {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    const unsub = useGameStore.subscribe(() => forceUpdate());
    return unsub;
  }, []);

  return useGameStore(selector);
}
