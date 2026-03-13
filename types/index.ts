export type TransactionCategory = "Need" | "Want" | "Treat" | "Invest";

export interface Transaction {
  id?: string;
  amount: number;
  category: TransactionCategory;
  created_at?: string;
}

export interface SpendingRatios {
  needs_ratio: number;
  wants_ratio: number;
  treat_ratio: number;
  invest_ratio: number;
}

export interface CityMetrics {
  housing: number;
  entertainment: number;
  pollution: number;
  growth: number;
}

export interface TransactionApiResponse {
  cityMetrics: CityMetrics;
  ratios: SpendingRatios;
  transactions: Transaction[];
  mode: "supabase" | "local-fallback";
}

export interface InsightApiResponse {
  insight: string;
}
