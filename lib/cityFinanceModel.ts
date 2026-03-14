export interface RawCityFinanceMetrics {
  needs: number;
  wants: number;
  investments: number;
  assets: number;
}

export type DerivedCityFinance = {
  needs: number;
  wants: number;
  investments: number;
  assets: number;
  infrastructureHealth: number;
  lifestyleIntensity: number;
  resilience: number;
  wealthStrength: number;
  financialBalance: number;
  instabilityRisk: number;
  developmentScore: number;
  developmentLevel: number;
  heightMultiplier: number;
  pollutionLevel: number;
  prosperityGlow: number;
};

export function normalizeMetric(value: number): number {
  return Math.max(0, Math.min(1, value / 100));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function deriveCityFinance(
  metrics: RawCityFinanceMetrics,
): DerivedCityFinance {
  const N = normalizeMetric(metrics.needs);
  const W = normalizeMetric(metrics.wants);
  const I = normalizeMetric(metrics.investments);
  const A = normalizeMetric(metrics.assets);

  const infrastructureHealth = clamp01(0.7 * N + 0.2 * I + 0.1 * A);

  const lifestyleIntensity = clamp01(
    0.75 * W + 0.15 * A + 0.1 * Math.max(0, N - 0.4),
  );

  const resilience = clamp01(0.65 * I + 0.25 * A + 0.1 * N);

  const wealthStrength = clamp01(0.75 * A + 0.25 * I);

  const mean = (N + W + I + A) / 4;
  const imbalance =
    (Math.abs(N - mean) +
      Math.abs(W - mean) +
      Math.abs(I - mean) +
      Math.abs(A - mean)) /
    4;
  const financialBalance = clamp01(1 - imbalance / 0.5);

  const wantsOverspend = Math.max(0, W - (N + I) / 2);
  const instabilityRisk = clamp01(
    0.55 * wantsOverspend +
      0.2 * (1 - N) +
      0.15 * (1 - I) +
      0.1 * (1 - financialBalance),
  );

  const developmentScore = clamp01(
    0.35 * N +
      0.35 * I +
      0.2 * A +
      0.1 * financialBalance -
      0.2 * instabilityRisk,
  );

  const developmentLevel = Math.min(5, Math.floor(developmentScore * 6));

  const heightMultiplier =
    0.9 + developmentLevel * 0.16 + resilience * 0.12 + wealthStrength * 0.08;

  const pollutionLevel = clamp01(
    0.45 * instabilityRisk +
      0.25 * (1 - infrastructureHealth) +
      0.2 * (1 - resilience) +
      0.1 * Math.max(0, lifestyleIntensity - 0.7),
  );

  const prosperityGlow = clamp01(
    0.45 * wealthStrength + 0.3 * resilience + 0.25 * financialBalance,
  );

  return {
    needs: N,
    wants: W,
    investments: I,
    assets: A,
    infrastructureHealth,
    lifestyleIntensity,
    resilience,
    wealthStrength,
    financialBalance,
    instabilityRisk,
    developmentScore,
    developmentLevel,
    heightMultiplier,
    pollutionLevel,
    prosperityGlow,
  };
}
