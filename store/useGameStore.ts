"use client";

import { create } from "zustand";

import { generateCityState, defaultCityState } from "@/lib/cityEngine";
import { calculateProportions } from "@/lib/financeEngine";
import type { CityState, Proportions, Transaction } from "@/types";

const defaultProportions: Proportions = {
  needs: 0,
  wants: 0,
  treats: 0,
  investments: 0,
};

interface GameStore {
  transactions: Transaction[];
  proportions: Proportions;
  cityState: CityState;
  advisorMessage: string;
  isAdvisorLoading: boolean;
  addTransaction: (t: Omit<Transaction, "id" | "created_at">) => Transaction[];
  loadFromStorage: () => void;
  setAdvisorMessage: (msg: string) => void;
  setAdvisorLoading: (loading: boolean) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  transactions: [],
  proportions: defaultProportions,
  cityState: defaultCityState,
  advisorMessage: "Log a transaction and your city will come to life.",
  isAdvisorLoading: false,

  addTransaction: (incoming) => {
    const transaction: Transaction = {
      ...incoming,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    const newTransactions = [...get().transactions, transaction];
    const proportions = calculateProportions(newTransactions);
    const cityState = generateCityState(proportions);

    if (typeof window !== "undefined") {
      localStorage.setItem("fq-transactions", JSON.stringify(newTransactions));
      localStorage.setItem("fq-proportions", JSON.stringify(proportions));
      localStorage.setItem("fq-city-state", JSON.stringify(cityState));
    }

    set({ transactions: newTransactions, proportions, cityState });
    return newTransactions;
  },

  loadFromStorage: () => {
    if (typeof window === "undefined") return;
    try {
      const txRaw  = localStorage.getItem("fq-transactions");
      const pRaw   = localStorage.getItem("fq-proportions");
      const csRaw  = localStorage.getItem("fq-city-state");
      const msgRaw = localStorage.getItem("fq-advisor");

      if (txRaw)  set({ transactions: JSON.parse(txRaw) as Transaction[] });
      if (pRaw)   set({ proportions: JSON.parse(pRaw) as Proportions });
      if (csRaw)  set({ cityState: JSON.parse(csRaw) as CityState });
      if (msgRaw) set({ advisorMessage: msgRaw });
    } catch {
      // ignore corrupt storage
    }
  },

  setAdvisorMessage: (msg) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("fq-advisor", msg);
    }
    set({ advisorMessage: msg });
  },

  setAdvisorLoading: (loading) => set({ isAdvisorLoading: loading }),
}));
