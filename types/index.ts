export type TransactionCategory = "Need" | "Want" | "Treat" | "Invest";

export interface Transaction {
  id?: string;
  user_id?: string | null;
  amount: number;
  category: TransactionCategory;
  merchant_name?: string | null;
  note?: string | null;
  source?: string;
  spent_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SpendingRatios {
  needs_ratio: number;
  wants_ratio: number;
  treat_ratio: number;
  invest_ratio: number;
}

export interface FinancialScores {
  liquidity: number;
  budgetHealth: number;
  investmentGrowth: number;
  stability: number;
  economyScore: number;
  totalSpent: number;
  transactionCount: number;
}

export interface CityMetrics {
  economyScore: number;
  entertainment: number;
  pollution: number;
  growth: number;
  infrastructure: number;
  liquidity: number;
  stability: number;
  parks: number;
  emergencyWarning: boolean;
}

export interface CityStructureInfo {
  id: string;
  title: string;
  category:
    | "housing"
    | "apartment"
    | "office"
    | "mall"
    | "pollution"
    | "park";
  metricValue: number;
  description: string;
}

export interface TriggeredLesson {
  id: string;
  title: string;
  description: string;
  lessonText: string;
}

export interface AIInsightPayload {
  insight: string;
  lesson: TriggeredLesson;
}

export interface AchievementState {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  unlocked: boolean;
}

export interface UserProgress {
  xp: number;
  level: number;
  nextLevelXp: number;
  achievements: AchievementState[];
}

export interface UserMetrics {
  ratios: SpendingRatios;
  scores: FinancialScores;
  cityMetrics: CityMetrics;
  transactionCount: number;
  totalSpent: number;
}

export interface DashboardPayload extends UserMetrics {
  transactions: Transaction[];
  progress: UserProgress;
  latestInsight?: AIInsightPayload | null;
}

export interface TransactionApiResponse extends DashboardPayload {
  warning?: string;
}

export interface InsightApiResponse {
  insight: string;
  lesson: TriggeredLesson;
}

export interface Group {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
  created_at: string;
}

export interface GroupLeaderboardEntry {
  userId: string;
  username: string;
  xp: number;
  level: number;
  cityGrowth: number;
}

export interface GroupMemberSummary {
  userId: string;
  username: string;
  role: "owner" | "member";
  joinedAt: string;
}

export interface GroupSummary extends Group {
  memberCount: number;
  members: GroupMemberSummary[];
  leaderboard: GroupLeaderboardEntry[];
}

export interface GroupMemberProfileResponse {
  group: {
    id: string;
    name: string;
  };
  member: GroupMemberSummary;
  dashboard: DashboardPayload;
}
