import type { CityMetrics, UserMetrics } from "@/types";

function clamp(value: number, minimum = 0, maximum = 100) {
  return Math.min(maximum, Math.max(minimum, Math.round(value)));
}

export function generateCityMetrics(metrics: Pick<UserMetrics, "ratios" | "scores">): CityMetrics {
  const { ratios, scores } = metrics;
  const balancedBonus =
    scores.budgetHealth > 72 && ratios.treat_ratio < 0.22 ? 14 : 0;
  const infrastructure = clamp(ratios.needs_ratio * 100 + scores.budgetHealth * 0.2);
  const entertainment = clamp(ratios.wants_ratio * 100 + 12);
  const pollution = clamp(
    ratios.treat_ratio * 125 - ratios.invest_ratio * 12 + ratios.wants_ratio * 10 + 8,
  );
  const growth = clamp(scores.investmentGrowth * 0.7 + ratios.invest_ratio * 35);
  const economyScore = clamp(scores.economyScore + balancedBonus * 0.4);
  const parks = clamp(
    balancedBonus + ratios.needs_ratio * 25 + ratios.invest_ratio * 18,
  );
  const emergencyWarning = scores.liquidity < 40;

  return {
    economyScore,
    entertainment,
    pollution,
    growth,
    infrastructure,
    liquidity: scores.liquidity,
    stability: scores.stability,
    parks,
    emergencyWarning,
  };
}
