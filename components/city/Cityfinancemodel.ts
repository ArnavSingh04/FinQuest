// cityFinanceModel.ts — maps spending ratios → derived city properties

export interface FinanceMetrics {
  needs: number;       // 0-100  infrastructure/essentials
  wants: number;       // 0-100  entertainment/lifestyle
  investments: number; // 0-100  CBD growth/wealth
  assets: number;      // 0-100  parks/treats/wellbeing
}

export interface DerivedCityFinance {
  // Visual qualities
  heightMultiplier: number;      // 0.6–2.4 tower height scaler
  infrastructureHealth: number;  // 0–1 road/sidewalk quality
  pollutionLevel: number;        // 0–1 smog/grime overlay
  prosperityGlow: number;        // 0–1 window glow / richness
  lifestyleIntensity: number;    // 0–1 neon / plaza energy
  resilience: number;            // 0–1 greenery / rooftop gardens
  wealthStrength: number;        // 0–1 metallic / gold accents
  instabilityRisk: number;       // 0–1 chaos / over-spending
  developmentLevel: number;      // integer 0–10 (triggers hammer)

  // Category-specific signals
  needsScore: number;            // 0–1 drives roads, schools, utilities
  wantsScore: number;            // 0–1 drives plazas, stadiums, neon
  investScore: number;           // 0–1 drives CBD towers, landmarks
  treatsScore: number;           // 0–1 drives parks, gyms, gardens

  // Animation triggers
  shouldDemolish: boolean;       // true when quality drops sharply
  expansionRadius: number;       // 1–4 city block radius
  pedestrianDensity: number;     // 0–1 how many walkers
  trafficDensity: number;        // 0–1 how many cars
  skyQuality: "clear" | "hazy" | "stormy" | "golden";
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

  // Ideal ratios (promotes healthy spending):
  // needs ~50%, invest ~20%, assets ~20%, wants ~10%
  const idealNeeds  = 0.50;
  const idealInvest = 0.20;
  const idealTreats = 0.20;
  const idealWants  = 0.10;

  const needsScore  = clamp(m.needs / 100);
  const wantsScore  = clamp(m.wants / 100);
  const investScore = clamp(m.investments / 100);
  const treatsScore = clamp(m.assets / 100);

  // Infrastructure improves with needs spending
  const infrastructureHealth = clamp(
    needsScore * 0.7 + investScore * 0.2 + treatsScore * 0.1
  );

  // Pollution rises with imbalanced wants, drops with investment + trees
  const pollution = clamp(
    wantsScore * 0.5 - treatsScore * 0.3 - investScore * 0.2 + 0.1
  );

  // Prosperity = investment + balanced needs
  const prosperityGlow = clamp(
    investScore * 0.6 + needsScore * 0.3 + treatsScore * 0.1
  );

  // Lifestyle = wants spending
  const lifestyleIntensity = clamp(wantsScore * 0.9 + treatsScore * 0.1);

  // Resilience = green/treat spending + some needs
  const resilience = clamp(treatsScore * 0.7 + needsScore * 0.2 + investScore * 0.1);

  // Wealth = investment-driven
  const wealthStrength = clamp(investScore * 0.8 + needsScore * 0.2);

  // Instability = over-indexing wants, neglecting needs
  const needsDeficit = clamp(idealNeeds - needsR, 0, 1);
  const wantsExcess  = clamp(wantsR - idealWants, 0, 1);
  const instabilityRisk = clamp(needsDeficit * 0.5 + wantsExcess * 0.5);

  // Height multiplier: investment drives towers up, instability slumps them
  const heightMultiplier = clamp(
    0.6 + investScore * 1.0 + needsScore * 0.4 - instabilityRisk * 0.4,
    0.6, 2.4
  );

  // Development level (integer 0–10) for hammer animation
  const rawLevel =
    investScore * 4 + needsScore * 3 + treatsScore * 2 + wantsScore * 1;
  const developmentLevel = Math.floor(clamp(rawLevel, 0, 10));

  // Demolish trigger when quality collapses (low needs + low invest)
  const shouldDemolish = infrastructureHealth < 0.3 && instabilityRisk > 0.5;

  // City expands outward with total spending balance
  const balance = 1 - Math.abs(needsR - idealNeeds)
                    - Math.abs(investR - idealInvest)
                    - Math.abs(treatsR - idealTreats)
                    - Math.abs(wantsR - idealWants);
  const expansionRadius = clamp(1 + balance * 3, 1, 4);

  // People density = lively city needs people
  const pedestrianDensity = clamp(
    needsScore * 0.3 + wantsScore * 0.3 + treatsScore * 0.2 + investScore * 0.2
  );

  // Traffic density = wants + needs drive cars
  const trafficDensity = clamp(
    wantsScore * 0.4 + needsScore * 0.4 + investScore * 0.2
  );

  // Sky quality reflects overall health
  let skyQuality: DerivedCityFinance["skyQuality"] = "clear";
  if (instabilityRisk > 0.6)       skyQuality = "stormy";
  else if (pollution > 0.5)        skyQuality = "hazy";
  else if (prosperityGlow > 0.7)   skyQuality = "golden";

  return {
    heightMultiplier,
    infrastructureHealth,
    pollutionLevel: pollution,
    prosperityGlow,
    lifestyleIntensity,
    resilience,
    wealthStrength,
    instabilityRisk,
    developmentLevel,
    needsScore,
    wantsScore,
    investScore,
    treatsScore,
    shouldDemolish,
    expansionRadius,
    pedestrianDensity,
    trafficDensity,
    skyQuality,
  };
}