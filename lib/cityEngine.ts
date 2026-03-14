import type { CityState, Proportions, WeatherType } from "@/types";

// Pure mapping functions — proportions in %, city values out
export const mapInvestToBank = (pct: number) => 1 + (pct / 30) * 7;
export const mapWantsToRestaurants = (pct: number) => Math.max(4, Math.round(pct / 100 * 12));
export const mapNeedsToApartments  = (pct: number) => Math.max(8, Math.round(pct / 100 * 24));
export const mapInvestToTower = (pct: number) => 0.5 + (pct / 20) * 4;

export function mapHealthToWeather(score: number): WeatherType {
  if (score >= 88) return "thriving";
  if (score >= 70) return "clear";
  if (score >= 50) return "overcast";
  if (score >= 30) return "rain";
  if (score >= 15) return "storm";
  return "destruction";
}

export function calculateHealthScore(p: Proportions, budgetUsed = 0): number {
  // Reward needs + investments, penalise heavy treats and overspending
  // Max possible: 20 + 25 + 60 = 105 → clamped to 100 (needs=50%, invest=40%, treats=0%)
  // 50/30/20 rule (needs=50%, wants=30%, invest=20%, treats=0%) → ~75
  const needsScore   = Math.min(50, p.needs * 100) * 0.5;        // up to 25
  const investScore  = Math.min(40, p.investments * 100) * 1.5;  // up to 60
  const treatPenalty = p.treats * 100 * 0.6;
  // Budget penalty: 0 if within budget, up to -25 if double over budget
  const budgetPenalty = budgetUsed > 1 ? Math.min(25, (budgetUsed - 1) * 50) : 0;
  const baseline = 20;
  return Math.max(0, Math.min(100, baseline + needsScore + investScore - treatPenalty - budgetPenalty));
}

export function generateCityState(proportions: Proportions, monthlyIncome = 0, totalSpend = 0): CityState {
  const needsPct    = proportions.needs * 100;
  const wantsPct    = proportions.wants * 100;
  const investPct   = proportions.investments * 100;
  const budgetUsed  = monthlyIncome > 0 ? totalSpend / monthlyIncome : 0;
  const healthScore = calculateHealthScore(proportions, budgetUsed);

  return {
    bankHeight:      mapInvestToBank(investPct),
    restaurantCount: mapWantsToRestaurants(wantsPct),
    apartmentCount:  mapNeedsToApartments(needsPct),
    towerHeight:     mapInvestToTower(investPct),
    weather:         mapHealthToWeather(healthScore),
    population:      Math.floor(healthScore / 10),
    healthScore:     Math.round(healthScore),
    budgetUsed,
  };
}

export const defaultCityState: CityState = {
  bankHeight: 1.5,
  restaurantCount: 2,
  apartmentCount: 3,
  towerHeight: 1,
  weather: "overcast",
  population: 5,
  healthScore: 50,
  budgetUsed: 0,
};
