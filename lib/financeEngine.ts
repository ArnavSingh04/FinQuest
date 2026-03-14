import type {
  FinancialScores,
  SpendingRatios,
  Transaction,
  TransactionCategory,
  UserMetrics,
} from "@/types";

const emptyRatios: SpendingRatios = {
  needs_ratio: 0,
  wants_ratio: 0,
  treat_ratio: 0,
  invest_ratio: 0,
};

function clamp(value: number, minimum = 0, maximum = 100) {
  return Math.min(maximum, Math.max(minimum, Math.round(value)));
}

export function calculateSpendingRatios(
  transactions: Transaction[],
): SpendingRatios {
  if (transactions.length === 0) {
    return emptyRatios;
  }

  const totalSpent = transactions.reduce(
    (sum, transaction) => sum + Number(transaction.amount || 0),
    0,
  );

  if (totalSpent <= 0) {
    return emptyRatios;
  }

  const categoryTotals = transactions.reduce(
    (totals, transaction) => {
      switch (transaction.category) {
        case "Need":
          totals.needs += transaction.amount;
          break;
        case "Want":
          totals.wants += transaction.amount;
          break;
        case "Treat":
          totals.treat += transaction.amount;
          break;
        case "Invest":
          totals.invest += transaction.amount;
          break;
        default:
          break;
      }

      return totals;
    },
    {
      needs: 0,
      wants: 0,
      treat: 0,
      invest: 0,
    },
  );

  return {
    needs_ratio: Number((categoryTotals.needs / totalSpent).toFixed(2)),
    wants_ratio: Number((categoryTotals.wants / totalSpent).toFixed(2)),
    treat_ratio: Number((categoryTotals.treat / totalSpent).toFixed(2)),
    invest_ratio: Number((categoryTotals.invest / totalSpent).toFixed(2)),
  };
}

function countCategory(
  transactions: Transaction[],
  category: TransactionCategory,
) {
  return transactions.filter((transaction) => transaction.category === category)
    .length;
}

export function calculateLiquidityScore(
  transactions: Transaction[],
  ratios = calculateSpendingRatios(transactions),
) {
  if (transactions.length === 0) {
    return 50;
  }

  return clamp(
    60 +
      ratios.invest_ratio * 25 +
      ratios.needs_ratio * 20 -
      ratios.treat_ratio * 35 -
      ratios.wants_ratio * 10,
  );
}

export function calculateBudgetHealth(
  transactions: Transaction[],
  ratios = calculateSpendingRatios(transactions),
) {
  if (transactions.length === 0) {
    return 50;
  }

  const idealMix = {
    needs_ratio: 0.5,
    wants_ratio: 0.2,
    treat_ratio: 0.1,
    invest_ratio: 0.2,
  };

  const variance =
    Math.abs(ratios.needs_ratio - idealMix.needs_ratio) +
    Math.abs(ratios.wants_ratio - idealMix.wants_ratio) +
    Math.abs(ratios.treat_ratio - idealMix.treat_ratio) +
    Math.abs(ratios.invest_ratio - idealMix.invest_ratio);

  return clamp(100 - variance * 120);
}

export function calculateInvestmentGrowth(
  transactions: Transaction[],
  ratios = calculateSpendingRatios(transactions),
) {
  if (transactions.length === 0) {
    return 0;
  }

  const investmentCount = countCategory(transactions, "Invest");
  const consistencyBonus = Math.min(25, investmentCount * 8);

  return clamp(ratios.invest_ratio * 75 + consistencyBonus);
}

export function calculateFinancialScores(
  transactions: Transaction[],
  ratios = calculateSpendingRatios(transactions),
): FinancialScores {
  const transactionCount = transactions.length;
  const totalSpent = Number(
    transactions.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0),
  );
  const liquidity = calculateLiquidityScore(transactions, ratios);
  const budgetHealth = calculateBudgetHealth(transactions, ratios);
  const investmentGrowth = calculateInvestmentGrowth(transactions, ratios);
  const stability = clamp(liquidity * 0.45 + budgetHealth * 0.55);
  const economyScore = clamp(
    budgetHealth * 0.4 + investmentGrowth * 0.35 + liquidity * 0.25,
  );

  return {
    liquidity,
    budgetHealth,
    investmentGrowth,
    stability,
    economyScore,
    totalSpent: Number(totalSpent.toFixed(2)),
    transactionCount,
  };
}

export function createEmptyUserMetrics(): UserMetrics {
  return {
    ratios: emptyRatios,
    scores: {
      liquidity: 50,
      budgetHealth: 50,
      investmentGrowth: 0,
      stability: 50,
      economyScore: 40,
      totalSpent: 0,
      transactionCount: 0,
    },
    cityMetrics: {
      economyScore: 40,
      entertainment: 20,
      pollution: 10,
      growth: 15,
      infrastructure: 25,
      liquidity: 50,
      stability: 50,
      parks: 0,
      emergencyWarning: false,
    },
    transactionCount: 0,
    totalSpent: 0,
  };
}
