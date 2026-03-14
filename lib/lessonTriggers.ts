import type { LessonTrigger, UserMetrics } from "@/types";

export interface LessonTriggerDefinition {
  id: string;
  concept: string;
  priority: number;
  dedupeWindowDays: number;
  shouldTrigger: (metrics: UserMetrics) => boolean;
  buildReason: (metrics: UserMetrics) => string;
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

const lessonTriggerDefinitions: LessonTriggerDefinition[] = [
  {
    id: "high-treat-ratio",
    concept: "Impulse Spending",
    priority: 100,
    dedupeWindowDays: 7,
    shouldTrigger: (metrics) => metrics.ratios.treat_ratio >= 0.22,
    buildReason: (metrics) =>
      `Treat spending is ${formatPercent(metrics.ratios.treat_ratio)} of recent activity, so a lesson on impulse spending is likely to be useful.`,
  },
  {
    id: "low-liquidity",
    concept: "Emergency Funds",
    priority: 92,
    dedupeWindowDays: 10,
    shouldTrigger: (metrics) => metrics.scores.liquidity < 45,
    buildReason: (metrics) =>
      `Liquidity is ${metrics.scores.liquidity}/100, which suggests the user may need more short-term financial breathing room.`,
  },
  {
    id: "budget-imbalance",
    concept: "Budget Balance",
    priority: 85,
    dedupeWindowDays: 7,
    shouldTrigger: (metrics) => metrics.scores.budgetHealth < 55,
    buildReason: (metrics) =>
      `Budget health is ${metrics.scores.budgetHealth}/100, so the spending mix is far enough from the target balance to justify a corrective lesson.`,
  },
  {
    id: "low-investment-activity",
    concept: "Starting to Invest",
    priority: 78,
    dedupeWindowDays: 10,
    shouldTrigger: (metrics) => metrics.ratios.invest_ratio < 0.1,
    buildReason: (metrics) =>
      `Investing is only ${formatPercent(metrics.ratios.invest_ratio)} of tracked spending, so the user would benefit from a beginner-friendly investing lesson.`,
  },
  {
    id: "strong-investment-habits",
    concept: "Compound Growth",
    priority: 52,
    dedupeWindowDays: 14,
    shouldTrigger: (metrics) => metrics.scores.investmentGrowth >= 65,
    buildReason: (metrics) =>
      `Investment growth is ${metrics.scores.investmentGrowth}/100, so this is a good moment to reinforce a healthy habit with a positive lesson.`,
  },
  {
    id: "balanced-behavior",
    concept: "Healthy Money Habits",
    priority: 40,
    dedupeWindowDays: 14,
    shouldTrigger: (metrics) =>
      metrics.scores.budgetHealth >= 72 && metrics.scores.stability >= 65,
    buildReason: (metrics) =>
      `Budget health is ${metrics.scores.budgetHealth}/100 and stability is ${metrics.scores.stability}/100, so the user is showing a balanced pattern worth reinforcing.`,
  },
];

export function getLessonTriggerDefinition(triggerId: string) {
  return lessonTriggerDefinitions.find((trigger) => trigger.id === triggerId) ?? null;
}

export function getTriggeredLessonTriggers(metrics: UserMetrics): LessonTrigger[] {
  if (metrics.transactionCount === 0) {
    return [];
  }

  return lessonTriggerDefinitions
    .filter((trigger) => trigger.shouldTrigger(metrics))
    .sort((a, b) => b.priority - a.priority)
    .map((trigger) => ({
      id: trigger.id,
      concept: trigger.concept,
      reason: trigger.buildReason(metrics),
      priority: trigger.priority,
    }));
}

export function getAllLessonTriggers(metrics: UserMetrics): LessonTrigger[] {
  if (metrics.transactionCount === 0) {
    return [];
  }

  return lessonTriggerDefinitions
    .slice()
    .sort((a, b) => b.priority - a.priority)
    .map((trigger) => ({
      id: trigger.id,
      concept: trigger.concept,
      reason: trigger.buildReason(metrics),
      priority: trigger.priority,
    }));
}

export function getPrimaryLessonTrigger(metrics: UserMetrics): LessonTrigger | null {
  return getTriggeredLessonTriggers(metrics)[0] ?? null;
}
