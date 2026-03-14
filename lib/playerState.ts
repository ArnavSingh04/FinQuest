import { generateCityMetrics } from "@/lib/cityEngine";
import { calculateFinancialScores, calculateSpendingRatios } from "@/lib/financeEngine";
import { calculateGamification } from "@/lib/gamification";
import type { AIInsightPayload, DashboardPayload, Transaction, UserMetrics } from "@/types";

export function buildUserMetrics(transactions: Transaction[]): UserMetrics {
  const ratios = calculateSpendingRatios(transactions);
  const scores = calculateFinancialScores(transactions, ratios);
  const cityMetrics = generateCityMetrics({ ratios, scores });

  return {
    ratios,
    scores,
    cityMetrics,
    transactionCount: scores.transactionCount,
    totalSpent: scores.totalSpent,
  };
}

export function buildDashboardPayload(params: {
  transactions: Transaction[];
  latestInsight?: AIInsightPayload | null;
}): DashboardPayload {
  const metrics = buildUserMetrics(params.transactions);
  const progress = calculateGamification({
    transactions: params.transactions,
    ratios: metrics.ratios,
    cityMetrics: metrics.cityMetrics,
  });

  return {
    transactions: params.transactions,
    ratios: metrics.ratios,
    scores: metrics.scores,
    cityMetrics: metrics.cityMetrics,
    transactionCount: metrics.transactionCount,
    totalSpent: metrics.totalSpent,
    progress,
    latestInsight: params.latestInsight ?? null,
  };
}
