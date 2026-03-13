import type { CityState, Proportions, WeatherType } from "@/types";

// Pure mapping functions — proportions in %, city values out
export const mapInvestToBank = (pct: number) => 1 + (pct / 30) * 7;
export const mapWantsToRestaurants = (pct: number) => Math.max(1, Math.floor(pct / 8));
export const mapNeedsToApartments = (pct: number) => Math.max(2, Math.floor(pct / 10));
export const mapInvestToTower = (pct: number) => 0.5 + (pct / 20) * 4;

export function mapHealthToWeather(score: number): WeatherType {
  if (score > 75) return "clear";
  if (score > 50) return "overcast";
  if (score > 30) return "rain";
  return "storm";
}

export function calculateHealthScore(p: Proportions): number {
  // Reward needs + investments, penalise heavy treats
  const needsScore  = Math.min(50, p.needs * 100) * 0.4;       // up to 20
  const investScore = Math.min(40, p.investments * 100) * 0.8;  // up to 32
  const treatPenalty = p.treats * 100 * 0.5;
  const baseline = 20;
  return Math.max(0, Math.min(100, baseline + needsScore + investScore - treatPenalty));
}

export function generateCityState(proportions: Proportions): CityState {
  const needsPct   = proportions.needs * 100;
  const wantsPct   = proportions.wants * 100;
  const investPct  = proportions.investments * 100;
  const healthScore = calculateHealthScore(proportions);

  return {
    bankHeight:      mapInvestToBank(investPct),
    restaurantCount: mapWantsToRestaurants(wantsPct),
    apartmentCount:  mapNeedsToApartments(needsPct),
    towerHeight:     mapInvestToTower(investPct),
    weather:         mapHealthToWeather(healthScore),
    population:      Math.floor(healthScore / 10),
    healthScore:     Math.round(healthScore),
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
};
