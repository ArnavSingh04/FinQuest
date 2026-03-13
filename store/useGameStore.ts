"use client";

import { create } from "zustand";

import { generateCityState, defaultCityState } from "@/lib/cityEngine";
import { calculateProportions } from "@/lib/financeEngine";
import type { CityState, Proportions, Transaction } from "@/types";

const defaultProportions: Proportions = { needs: 0, wants: 0, treats: 0, investments: 0 };

interface GameStore {
  transactions: Transaction[];
  proportions: Proportions;
  cityState: CityState;
  advisorMessage: string;
  isAdvisorLoading: boolean;
  addTransaction: (t: Omit<Transaction, "id" | "created_at">) => Transaction[];
  clearAll: () => void;
  loadFromStorage: () => void;
  setAdvisorMessage: (msg: string) => void;
  setAdvisorLoading: (loading: boolean) => void;
}

function persist(key: string, value: unknown) {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  transactions: [],
  proportions: defaultProportions,
  cityState: defaultCityState,
  advisorMessage: "Log a transaction and your city will come to life.",
  isAdvisorLoading: false,

  addTransaction: (incoming) => {
    const tx: Transaction = {
      ...incoming,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    const newTxs = [...get().transactions, tx];
    const proportions = calculateProportions(newTxs);
    const cityState = generateCityState(proportions);

    persist("fq-transactions", newTxs);
    persist("fq-proportions", proportions);
    persist("fq-city-state", cityState);

    set({ transactions: newTxs, proportions, cityState });
    return newTxs;
  },

  clearAll: () => {
    ["fq-transactions", "fq-proportions", "fq-city-state", "fq-advisor"].forEach((k) => {
      if (typeof window !== "undefined") localStorage.removeItem(k);
    });
    set({
      transactions: [],
      proportions: defaultProportions,
      cityState: defaultCityState,
      advisorMessage: "Log a transaction and your city will come to life.",
    });
  },

  loadFromStorage: () => {
    if (typeof window === "undefined") return;
    try {
      const txRaw  = localStorage.getItem("fq-transactions");
      const pRaw   = localStorage.getItem("fq-proportions");
      const csRaw  = localStorage.getItem("fq-city-state");
      const msgRaw = localStorage.getItem("fq-advisor");

      const updates: Partial<GameStore> = {};
      if (txRaw)  updates.transactions   = JSON.parse(txRaw);
      if (pRaw)   updates.proportions    = JSON.parse(pRaw);
      if (csRaw)  updates.cityState      = JSON.parse(csRaw);
      if (msgRaw) updates.advisorMessage = msgRaw;
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
}));
