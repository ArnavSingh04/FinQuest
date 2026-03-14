export interface FinancialRatios {
  needs: number;
  wants: number;
  investments: number;
  assets: number;
}

export interface DerivedCityMetrics {
  infrastructureHealth: number;
  lifestyleIntensity: number;
  resilience: number;
  wealthStrength: number;
  financialBalance: number;
  instabilityRisk: number;
  developmentScore: number;
  developmentLevel: number;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

function computeBalance(needs: number, wants: number, investments: number, assets: number) {
  const average = (needs + wants + investments + assets) / 4;
  const variance =
    (Math.abs(needs - average) +
      Math.abs(wants - average) +
      Math.abs(investments - average) +
      Math.abs(assets - average)) /
    4;

  return clamp01(1 - variance * 1.1);
}

function computeDevelopmentLevel(score: number) {
  return Math.floor(clamp01(score) * 5);
}

export function computeDerivedCityMetrics(
  ratios: FinancialRatios,
): DerivedCityMetrics {
  const needs = clamp01(ratios.needs);
  const wants = clamp01(ratios.wants);
  const investments = clamp01(ratios.investments);
  const assets = clamp01(ratios.assets);

  const infrastructureHealth = clamp01(needs * 0.9 + investments * 0.2);
  const resilience = clamp01(investments * 0.65 + assets * 0.35);
  const wealthStrength = clamp01(assets * 0.7 + investments * 0.2 + needs * 0.1);
  const workout = clamp01(0.75 * wants + infrastructureHealth * 0.25);
  const lifestyleIntensity = clamp01(workout + (1 - infrastructureHealth) * 0.25);
  const financialBalance = computeBalance(needs, wants, investments, assets);

  const wantsDrain = Math.max(0, wants - (needs + investments) * 0.45);
  const instabilityRisk = clamp01(wantsDrain + (1 - financialBalance) * 0.3);

  const baseScore =
    infrastructureHealth * 0.35 +
    resilience * 0.35 +
    wealthStrength * 0.15 +
    financialBalance * 0.15;
  const developmentScore = clamp01(
    baseScore * (1 - instabilityRisk * 0.5) + assets * 0.05,
  );

  const developmentLevel = computeDevelopmentLevel(developmentScore);

  return {
    infrastructureHealth,
    lifestyleIntensity,
    resilience,
    wealthStrength,
    financialBalance,
    instabilityRisk,
    developmentScore,
    developmentLevel,
  };
}
