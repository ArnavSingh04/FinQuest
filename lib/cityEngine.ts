import type {
  CityMetrics,
  CityState,
  FinancialScores,
  Proportions,
  SpendingRatios,
  WeatherType,
} from "@/types";

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

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

export function generateCityMetrics(input: {
  ratios: SpendingRatios;
  scores: FinancialScores;
}): CityMetrics {
  const { ratios, scores } = input;
  const infrastructure = clamp(
    scores.stability * 0.4 + ratios.needs_ratio * 100 * 0.6,
  );
  const entertainment = clamp(
    ratios.wants_ratio * 100 * 0.7 + scores.economyScore * 0.2 + 10,
  );
  const growth = clamp(
    scores.investmentGrowth * 0.55 + ratios.invest_ratio * 100 * 0.35 + 8,
  );
  const pollution = clamp(
    ratios.treat_ratio * 100 * 0.8 +
      ratios.wants_ratio * 100 * 0.25 -
      scores.stability * 0.2,
  );
  const parks = clamp(
    ratios.invest_ratio * 100 * 0.5 + ratios.needs_ratio * 100 * 0.25 - 10,
  );

  return {
    economyScore: clamp(scores.economyScore),
    entertainment,
    pollution,
    growth,
    infrastructure,
    liquidity: clamp(scores.liquidity),
    stability: clamp(scores.stability),
    parks,
    emergencyWarning: scores.liquidity < 35 || scores.stability < 30,
  };
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
