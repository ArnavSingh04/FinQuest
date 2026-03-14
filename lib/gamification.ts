import type {
  AchievementState,
  CityMetrics,
  SpendingRatios,
  Transaction,
  UserProgress,
} from "@/types";

interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  isUnlocked: (params: {
    transactions: Transaction[];
    ratios: SpendingRatios;
    cityMetrics: CityMetrics;
  }) => boolean;
}

const achievementDefinitions: AchievementDefinition[] = [
  {
    id: "city-founder",
    title: "City Founder",
    description: "Logged your first transaction.",
    xpReward: 20,
    isUnlocked: ({ transactions }) => transactions.length >= 1,
  },
  {
    id: "first-investment",
    title: "First Investment",
    description: "Made your first investment.",
    xpReward: 100,
    isUnlocked: ({ transactions }) =>
      transactions.some((transaction) => transaction.category === "Invest"),
  },
  {
    id: "disciplined-saver",
    title: "Disciplined Saver",
    description: "Investments are at least 20% of spending.",
    xpReward: 70,
    isUnlocked: ({ ratios }) => ratios.invest_ratio >= 0.2,
  },
  {
    id: "balanced-budget",
    title: "Balanced Budget",
    description: "Stayed close to the 50/30/20 rule.",
    xpReward: 90,
    isUnlocked: ({ ratios }) =>
      ratios.needs_ratio <= 0.5 &&
      ratios.wants_ratio + ratios.treat_ratio <= 0.3 &&
      ratios.invest_ratio >= 0.2,
  },
  {
    id: "city-thriving",
    title: "City Thriving",
    description: "Achieved a city health score of at least 88.",
    xpReward: 120,
    isUnlocked: ({ cityMetrics }) =>
      cityMetrics.economyScore >= 88 || cityMetrics.growth >= 80,
  },
  {
    id: "clean-streak",
    title: "Clean Streak",
    description: "Kept treats under 5% of spending.",
    xpReward: 80,
    isUnlocked: ({ ratios, transactions }) =>
      transactions.length >= 3 && ratios.treat_ratio <= 0.05,
  },
  {
    id: "tycoon",
    title: "Tycoon",
    description: "Investments reached 35% of spending.",
    xpReward: 80,
    isUnlocked: ({ ratios }) => ratios.invest_ratio >= 0.35,
  },
];

function calculateLevel(xp: number) {
  return Math.max(1, Math.floor(xp / 120) + 1);
}

export function calculateGamification(params: {
  transactions: Transaction[];
  ratios: SpendingRatios;
  cityMetrics: CityMetrics;
}): UserProgress {
  const achievements: AchievementState[] = achievementDefinitions.map((achievement) => {
    const unlocked = achievement.isUnlocked(params);

    return {
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      xpReward: achievement.xpReward,
      unlocked,
    };
  });

  const xp = achievements.reduce((total, achievement) => {
    return total + (achievement.unlocked ? achievement.xpReward : 0);
  }, 0);

  const level = calculateLevel(xp);

  return {
    xp,
    level,
    nextLevelXp: level * 120,
    achievements,
  };
}
