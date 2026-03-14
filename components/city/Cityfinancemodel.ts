// cityFinanceModel.ts
// FINANCIAL PHILOSOPHY:
//   Needs (50% ideal)   → infrastructure health, roads, schools — always rewarded
//   Invest (20% ideal)  → TALLEST towers, biggest skyline spike — maximum reward
//   Assets (20% ideal)  → parks, gyms, greenery, resilience — always rewarded
//   Wants (10% ideal)   → fun but excess triggers meteor/attack demolition events

export interface FinanceMetrics {
  needs: number;       // 0-100
  wants: number;       // 0-100
  investments: number; // 0-100
  assets: number;      // 0-100
}

export interface DerivedCityFinance {
  heightMultiplier: number;      // 0.6–3.2  investments drive this HIGHEST
  infrastructureHealth: number;  // 0–1
  pollutionLevel: number;        // 0–1
  prosperityGlow: number;        // 0–1
  lifestyleIntensity: number;    // 0–1
  resilience: number;            // 0–1
  wealthStrength: number;        // 0–1
  instabilityRisk: number;       // 0–1
  developmentLevel: number;      // 0–10 triggers hammer

  needsScore: number;
  wantsScore: number;
  investScore: number;
  treatsScore: number;

  shouldDemolish: boolean;       // wants excess triggers meteor/attack
  demolishIntensity: number;     // 0–1
  expansionRadius: number;       // 1–5
  pedestrianDensity: number;
  trafficDensity: number;
  skyQuality: "clear" | "hazy" | "stormy" | "golden";

  // For dashboard
  totalSpent: number;
  balanceScore: number;
  needsRatio: number;
  wantsRatio: number;
  investRatio: number;
  treatsRatio: number;
}

function clamp(v: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v));
}

export function deriveCityFinance(m: FinanceMetrics): DerivedCityFinance {
  const total = m.needs + m.wants + m.investments + m.assets || 1;
  const needsR  = clamp(m.needs / total);
  const wantsR  = clamp(m.wants / total);
  const investR = clamp(m.investments / total);
  const treatsR = clamp(m.assets / total);

  const needsScore  = clamp(m.needs / 100);
  const wantsScore  = clamp(m.wants / 100);
  const investScore = clamp(m.investments / 100);
  const treatsScore = clamp(m.assets / 100);

  // Ideal ratios
  const idealNeeds  = 0.50;
  const idealInvest = 0.20;
  const idealTreats = 0.20;
  const idealWants  = 0.10;

  const wantsExcess = clamp(wantsR - idealWants, 0, 1);
  const needsDeficit = clamp(idealNeeds - needsR, 0, 1);

  const infrastructureHealth = clamp(needsScore * 0.65 + investScore * 0.25 + treatsScore * 0.10);
  const pollution = clamp(wantsExcess * 1.3 + wantsScore * 0.25 - treatsScore * 0.4 - investScore * 0.3 - needsScore * 0.1 + 0.05);
  const prosperityGlow = clamp(investScore * 0.70 + needsScore * 0.20 + treatsScore * 0.10);
  const lifestyleIntensity = clamp(wantsScore * 0.85 + treatsScore * 0.15);
  const resilience = clamp(treatsScore * 0.65 + needsScore * 0.25 + investScore * 0.10);
  const wealthStrength = clamp(investScore * 0.85 + needsScore * 0.15);
  const instabilityRisk = clamp(wantsExcess * 0.70 + needsDeficit * 0.30);

  // INVESTMENTS = maximum tower height spike
  const heightMultiplier = clamp(
    0.6 + investScore * 2.0 + needsScore * 0.45 + treatsScore * 0.15 - instabilityRisk * 0.6,
    0.6, 3.2
  );

  const rawLevel = investScore * 5 + needsScore * 3 + treatsScore * 2;
  const developmentLevel = Math.floor(clamp(rawLevel, 0, 10));

  // Demolish when wants are excessive (meteor/attack)
  const shouldDemolish = wantsExcess > 0.30 && wantsScore > 0.25;
  const demolishIntensity = clamp(wantsExcess * 2.0);

  const balancePenalty =
    Math.abs(needsR - idealNeeds) * 1.5 +
    Math.abs(investR - idealInvest) * 1.5 +
    Math.abs(treatsR - idealTreats) * 1.2 +
    Math.abs(wantsR - idealWants) * 1.0;
  const expansionRadius = clamp(1.5 + (1 - balancePenalty) * 3.5 + investScore * 1.0, 1, 5);

  const pedestrianDensity = clamp(needsScore * 0.30 + treatsScore * 0.30 + wantsScore * 0.20 + investScore * 0.20);
  const trafficDensity = clamp(needsScore * 0.45 + investScore * 0.30 + wantsScore * 0.25);

  let skyQuality: DerivedCityFinance["skyQuality"] = "clear";
  if (shouldDemolish || instabilityRisk > 0.5) skyQuality = "stormy";
  else if (pollution > 0.4)                     skyQuality = "hazy";
  else if (prosperityGlow > 0.60)               skyQuality = "golden";

  const balanceScore = Math.max(0, Math.round(100 - balancePenalty * 55));

  return {
    heightMultiplier, infrastructureHealth, pollutionLevel: pollution,
    prosperityGlow, lifestyleIntensity, resilience, wealthStrength,
    instabilityRisk, developmentLevel,
    needsScore, wantsScore, investScore, treatsScore,
    shouldDemolish, demolishIntensity, expansionRadius,
    pedestrianDensity, trafficDensity, skyQuality,
    totalSpent: total, balanceScore,
    needsRatio: needsR, wantsRatio: wantsR, investRatio: investR, treatsRatio: treatsR,
  };
}

export interface FinancialAdvice {
  priority: "critical" | "warning" | "good" | "great";
  title: string;
  message: string;
  action: string;
  icon: string;
}

export function generateAdvice(finance: DerivedCityFinance): FinancialAdvice[] {
  const advice: FinancialAdvice[] = [];
  const { needsRatio, wantsRatio, investRatio, treatsRatio, balanceScore } = finance;

  if (wantsRatio > 0.30) {
    advice.push({ priority: "critical", icon: "☄️",
      title: "Wants Overload — Meteors Incoming!",
      message: `${Math.round(wantsRatio * 100)}% on wants is catastrophic. Your towers are being destroyed by overspending!`,
      action: "Cut wants to under 15%. Redirect to needs or invest immediately." });
  } else if (wantsRatio > 0.18) {
    advice.push({ priority: "warning", icon: "⚠️",
      title: "Wants Creeping High",
      message: `${Math.round(wantsRatio * 100)}% on lifestyle — smog is building over your city.`,
      action: "Try a 'no-spend week' on entertainment to rebalance." });
  }

  if (needsRatio < 0.30) {
    advice.push({ priority: "critical", icon: "🏚️",
      title: "Essential Spending Too Low",
      message: "Roads are crumbling, schools closing. Needs should be ~50% of spending.",
      action: "Prioritise rent, food, transport and utilities before anything else." });
  } else if (needsRatio >= 0.42 && needsRatio <= 0.62) {
    advice.push({ priority: "great", icon: "🏗️",
      title: "Needs Perfectly Funded!",
      message: `${Math.round(needsRatio * 100)}% on essentials. Infrastructure is booming!`,
      action: "Solid foundation. Now push investments higher for skyscraper growth." });
  }

  if (investRatio < 0.08) {
    advice.push({ priority: "warning", icon: "📉",
      title: "No Investment = Flat Skyline",
      message: "Your CBD is a ghost town. Investments are the #1 driver of tower height.",
      action: "Even 10% invested now compounds into wealth. Start small, stay consistent." });
  } else if (investRatio >= 0.16 && investRatio <= 0.32) {
    advice.push({ priority: "great", icon: "🏙️",
      title: "Investments Raising the Skyline!",
      message: `${Math.round(investRatio * 100)}% invested — your towers are soaring higher every transaction!`,
      action: "Compound interest rewards patience. Keep this up for 10+ years!" });
  } else if (investRatio > 0.40) {
    advice.push({ priority: "good", icon: "📈",
      title: "Power Investor",
      message: "Impressive investment ratio — just make sure needs & treats aren't suffering.",
      action: "Diversify: needs keep your city stable, treats make it resilient." });
  }

  if (treatsRatio < 0.08) {
    advice.push({ priority: "warning", icon: "🪨",
      title: "Zero Wellbeing Spending",
      message: "Your city has no parks or gyms. Self-investment builds long-term resilience.",
      action: "Allocate 15–20% to health, education and personal development." });
  } else if (treatsRatio >= 0.14 && treatsRatio <= 0.28) {
    advice.push({ priority: "great", icon: "🌳",
      title: "Thriving Green Spaces!",
      message: "Parks and gyms are flourishing — your city's resilience is high!",
      action: "Wellbeing spending pays dividends in health and productivity." });
  }

  if (balanceScore >= 78) {
    advice.push({ priority: "great", icon: "🌟",
      title: "Golden City Status!",
      message: `Balance score ${balanceScore}/100. You're mastering the 50/20/20/10 rule.`,
      action: "You're a financial role model. Keep this balance as income grows." });
  }

  const order = { critical: 0, warning: 1, good: 2, great: 3 };
  return advice.sort((a, b) => order[a.priority] - order[b.priority]).slice(0, 5);
}