export interface RawCityFinanceMetrics {
  needs: number;
  wants: number;
  investments: number;
  assets: number;
}

export type DerivedCityFinance = {
  // Normalized 0..1 raw categories
  needs: number;
  wants: number;
  investments: number;
  assets: number;
  // Compatibility aliases used by city components
  needsScore: number;
  wantsScore: number;
  investScore: number;
  treatsScore: number;
  needsRatio: number;
  wantsRatio: number;
  investRatio: number;
  treatsRatio: number;
  infrastructureHealth: number;
  lifestyleIntensity: number;
  resilience: number;
  wealthStrength: number;
  financialBalance: number;
  balanceScore: number;
  instabilityRisk: number;
  developmentScore: number;
  developmentLevel: number;
  heightMultiplier: number;
  pollutionLevel: number;
  prosperityGlow: number;
  expansionRadius: number;
  trafficDensity: number;
  pedestrianDensity: number;
  shouldDemolish: boolean;
  demolishIntensity: number;
  skyQuality: "clear" | "hazy" | "stormy" | "golden";
  totalSpent: number;
};

export interface FinancialAdvice {
  priority: "critical" | "warning" | "good" | "great";
  title: string;
  message: string;
  action: string;
  icon: string;
}

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

  const balanceScore = Math.round(financialBalance * 100);
  const expansionRadius = 1 + financialBalance * 4;
  const trafficDensity = clamp01(
    0.2 + lifestyleIntensity * 0.45 + developmentScore * 0.35,
  );
  const pedestrianDensity = clamp01(
    0.2 + infrastructureHealth * 0.35 + lifestyleIntensity * 0.45,
  );

  const shouldDemolish = W > 0.3 && instabilityRisk > 0.42;
  const demolishIntensity = clamp01((W - 0.3) * 2 + instabilityRisk * 0.35);

  const skyQuality: DerivedCityFinance["skyQuality"] =
    instabilityRisk > 0.65
      ? "stormy"
      : pollutionLevel > 0.45
        ? "hazy"
        : prosperityGlow > 0.65 && financialBalance > 0.55
          ? "golden"
          : "clear";

  return {
    needs: N,
    wants: W,
    investments: I,
    assets: A,
    needsScore: N,
    wantsScore: W,
    investScore: I,
    treatsScore: A,
    needsRatio: N,
    wantsRatio: W,
    investRatio: I,
    treatsRatio: A,
    infrastructureHealth,
    lifestyleIntensity,
    resilience,
    wealthStrength,
    financialBalance,
    balanceScore,
    instabilityRisk,
    developmentScore,
    developmentLevel,
    heightMultiplier,
    pollutionLevel,
    prosperityGlow,
    expansionRadius,
    trafficDensity,
    pedestrianDensity,
    shouldDemolish,
    demolishIntensity,
    skyQuality,
    totalSpent:
      Math.max(0, metrics.needs) +
      Math.max(0, metrics.wants) +
      Math.max(0, metrics.investments) +
      Math.max(0, metrics.assets),
  };
}

export function generateAdvice(finance: DerivedCityFinance): FinancialAdvice[] {
  const advice: FinancialAdvice[] = [];
  const { needsRatio, wantsRatio, investRatio, treatsRatio, balanceScore } = finance;

  if (wantsRatio > 0.3) {
    advice.push({
      priority: "critical",
      icon: "⚠️",
      title: "Wants too high",
      message: `${Math.round(wantsRatio * 100)}% in wants is destabilizing your city.`,
      action: "Move spend to needs and investments this week.",
    });
  } else if (wantsRatio > 0.2) {
    advice.push({
      priority: "warning",
      icon: "🎮",
      title: "Wants are elevated",
      message: "Lifestyle is high; keep it balanced with essentials.",
      action: "Cap wants and redirect a small share to investments.",
    });
  }

  if (needsRatio < 0.3) {
    advice.push({
      priority: "critical",
      icon: "🏚️",
      title: "Needs underfunded",
      message: "Infrastructure weakens when essentials are too low.",
      action: "Increase needs allocation first.",
    });
  } else if (needsRatio >= 0.42) {
    advice.push({
      priority: "great",
      icon: "🏗️",
      title: "Needs well funded",
      message: "Essentials are supporting stable city growth.",
      action: "Maintain this baseline and build investments.",
    });
  }

  if (investRatio < 0.1) {
    advice.push({
      priority: "warning",
      icon: "📉",
      title: "Investments are low",
      message: "Long-term growth slows without investment.",
      action: "Aim for at least 15-20% investing.",
    });
  } else if (investRatio >= 0.16 && investRatio <= 0.32) {
    advice.push({
      priority: "great",
      icon: "🏙️",
      title: "Investments on track",
      message: "You are funding resilient long-term growth.",
      action: "Keep consistent contributions.",
    });
  }

  if (treatsRatio < 0.08) {
    advice.push({
      priority: "good",
      icon: "🌳",
      title: "Low wellbeing spend",
      message: "No room for wellbeing can reduce resilience over time.",
      action: "Reserve a small share for health/learning/recovery.",
    });
  }

  if (balanceScore >= 80) {
    advice.push({
      priority: "great",
      icon: "🌟",
      title: "Strong financial balance",
      message: `Balance score ${balanceScore}/100.`,
      action: "Keep this structure as income grows.",
    });
  }

  const order = { critical: 0, warning: 1, good: 2, great: 3 };
  return advice
    .sort((a, b) => order[a.priority] - order[b.priority])
    .slice(0, 5);
}
