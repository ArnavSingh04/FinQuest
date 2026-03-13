import type { Proportions, Transaction } from "@/types";

const empty: Proportions = { needs: 0, wants: 0, treats: 0, investments: 0 };

export function calculateProportions(transactions: Transaction[]): Proportions {
  if (!transactions.length) return empty;

  const total = transactions.reduce((sum, t) => sum + Number(t.amount ?? 0), 0);
  if (total <= 0) return empty;

  const cats = transactions.reduce(
    (acc, t) => {
      switch (t.category) {
        case "Need":   acc.needs += t.amount; break;
        case "Want":   acc.wants += t.amount; break;
        case "Treat":  acc.treats += t.amount; break;
        case "Invest": acc.investments += t.amount; break;
      }
      return acc;
    },
    { needs: 0, wants: 0, treats: 0, investments: 0 },
  );

  return {
    needs: Number((cats.needs / total).toFixed(3)),
    wants: Number((cats.wants / total).toFixed(3)),
    treats: Number((cats.treats / total).toFixed(3)),
    investments: Number((cats.investments / total).toFixed(3)),
  };
}
