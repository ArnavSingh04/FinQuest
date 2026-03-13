export type TransactionCategory = "Need" | "Want" | "Treat" | "Invest";
export type WeatherType = "thriving" | "clear" | "overcast" | "rain" | "storm" | "destruction";

export interface Transaction {
  id?: string;
  amount: number;
  category: TransactionCategory;
  merchant?: string;
  created_at?: string;
}

export interface Proportions {
  needs: number;       // 0–1
  wants: number;       // 0–1
  treats: number;      // 0–1
  investments: number; // 0–1
}

export interface CityState {
  bankHeight: number;       // 1–8, driven by investments %
  restaurantCount: number;  // 1–6, driven by wants %
  apartmentCount: number;   // 2–8, driven by needs %
  towerHeight: number;      // 0.5–5, driven by investments %
  weather: WeatherType;
  population: number;       // 0–10
  healthScore: number;      // 0–100
  budgetUsed: number;       // 0–1+ (fraction of monthly income spent)
}

export interface AdvisorResponse {
  message: string;
}
