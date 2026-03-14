import type { TriggeredLesson, UserMetrics } from "@/types";

export interface FinancialConceptDefinition extends TriggeredLesson {
  triggerCondition: (metrics: UserMetrics) => boolean;
}

export const financialConcepts: FinancialConceptDefinition[] = [
  {
    id: "impulse-spending",
    title: "Impulse Spending",
    description: "Treat spending is starting to crowd out healthier habits.",
    lessonText:
      "Quick dopamine purchases feel fun now, but too many impulse buys can stop your future city from growing. Try setting a weekly treat cap before you spend.",
    triggerCondition: (metrics) => metrics.ratios.treat_ratio >= 0.22,
  },
  {
    id: "emergency-funds",
    title: "Emergency Funds",
    description: "Low liquidity means your city has less room to absorb surprises.",
    lessonText:
      "Emergency funds act like a backup battery for your finances. A small cash buffer makes unexpected costs less stressful and keeps your city stable.",
    triggerCondition: (metrics) => metrics.scores.liquidity < 45,
  },
  {
    id: "diversification",
    title: "Diversification",
    description: "Investing steadily makes your economy more resilient over time.",
    lessonText:
      "Diversification means you do not rely on one money move to win. Spreading investments and keeping some money liquid lowers risk while still helping growth.",
    triggerCondition: (metrics) => metrics.ratios.invest_ratio >= 0.2,
  },
  {
    id: "budget-balance",
    title: "Budget Balance",
    description: "Your spending mix is close to a healthy long-term balance.",
    lessonText:
      "A balanced budget gives every dollar a job. When needs are covered, fun spending stays controlled, and investing keeps happening, your city becomes easier to maintain.",
    triggerCondition: (metrics) => metrics.scores.budgetHealth >= 72,
  },
  {
    id: "compound-growth",
    title: "Compound Growth",
    description: "Your investing pattern is strong enough to unlock long-term compounding lessons.",
    lessonText:
      "Compound growth means money can start earning money for you over time. Starting early with small amounts matters more than waiting for a perfect moment.",
    triggerCondition: (metrics) => metrics.scores.investmentGrowth >= 65,
  },
];

export function getTriggeredConcepts(metrics: UserMetrics) {
  return financialConcepts.filter((concept) => concept.triggerCondition(metrics));
}

export function getPrimaryLesson(metrics: UserMetrics): TriggeredLesson {
  return (
    getTriggeredConcepts(metrics)[0] ?? {
      id: "money-basics",
      title: "Money Basics",
      description: "Your city grows best when spending stays intentional.",
      lessonText:
        "Keep your essentials covered first, stay careful with treat spending, and invest regularly so your future keeps getting stronger.",
    }
  );
}
