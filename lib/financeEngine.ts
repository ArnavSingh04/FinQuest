import type { SpendingRatios, Transaction } from "@/types";

const emptyRatios: SpendingRatios = {
  needs_ratio: 0,
  wants_ratio: 0,
  treat_ratio: 0,
  invest_ratio: 0,
};

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
