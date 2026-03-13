import type { CityMetrics, SpendingRatios } from "@/types";

function ratioToMetric(ratio: number, minimum = 10) {
  return Math.min(100, Math.round(ratio * 100) + minimum);
}

export function generateCityMetrics(ratios: SpendingRatios): CityMetrics {
  return {
    // Needs spending keeps the city functional, so it becomes the housing baseline.
    housing: ratioToMetric(ratios.needs_ratio, 20),
    // Wants spending adds fun and visual energy to the city.
    entertainment: ratioToMetric(ratios.wants_ratio, 12),
    // Treat-heavy habits increase pollution in this simple MVP model.
    pollution: ratioToMetric(ratios.treat_ratio, 8),
    // Investment spending drives long-term growth and taller buildings.
    growth: ratioToMetric(ratios.invest_ratio, 15),
  };
}
