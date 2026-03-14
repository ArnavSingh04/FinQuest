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
    id: "first-transaction",
    title: "First Transaction",
    description: "Log your first spending event.",
    xpReward: 20,
    isUnlocked: ({ transactions }) => transactions.length >= 1,
  },
  {
    id: "balanced-spending",
    title: "Balanced Spending",
    description: "Keep your budget healthy across essentials, fun, and investing.",
    xpReward: 50,
    isUnlocked: ({ ratios, cityMetrics }) =>
      cityMetrics.stability >= 70 && ratios.treat_ratio <= 0.18,
  },
  {
    id: "first-investment",
    title: "First Investment",
    description: "Start putting money toward future growth.",
    xpReward: 100,
    isUnlocked: ({ transactions }) =>
      transactions.some((transaction) => transaction.category === "Invest"),
  },
  {
    id: "city-builder",
    title: "City Builder",
    description: "Grow your city's economy and skyline.",
    xpReward: 80,
    isUnlocked: ({ cityMetrics }) => cityMetrics.growth >= 60,
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
