import OpenAI from "openai";
import type { Transaction } from "@/types";

interface TransactionPattern {
  type: "large_purchase" | "frequent_category" | "impulse_spending" | "category_dominance" | "subscription";
  data: {
    amount?: number;
    category?: string;
    merchant_name?: string;
    count?: number;
    percentage?: number;
    transactions?: Transaction[];
  };
}

interface LessonTrigger {
  lesson_id: string;
  lesson_title: string;
  pattern: TransactionPattern;
  transactions: Transaction[];
}

export async function detectTransactionPatterns(
  transactions: Transaction[],
): Promise<TransactionPattern[]> {
  const patterns: TransactionPattern[] = [];

  if (transactions.length === 0) {
    return patterns;
  }

  // Pattern 1: Large purchase (> $50 for better detection with smaller datasets)
  const largePurchases = transactions.filter((t) => Number(t.amount) > 50);
  if (largePurchases.length > 0) {
    const largest = largePurchases.reduce((max, t) =>
      Number(t.amount) > Number(max.amount) ? t : max,
    );
    patterns.push({
      type: "large_purchase",
      data: {
        amount: Number(largest.amount),
        merchant_name: largest.merchant_name || "Unknown",
        category: largest.category,
        transactions: [largest],
      },
    });
  }

  // Pattern 2: Category dominance (> 40% of spending)
  const totalSpent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const categoryTotals = transactions.reduce(
    (acc, t) => {
      const cat = t.category;
      acc[cat] = (acc[cat] || 0) + Number(t.amount);
      return acc;
    },
    {} as Record<string, number>,
  );

  for (const [category, amount] of Object.entries(categoryTotals)) {
    const percentage = (amount / totalSpent) * 100;
    // Lower threshold to 35% to catch more patterns (like $200 out of $290 = 69%)
    if (percentage > 35) {
      patterns.push({
        type: "category_dominance",
        data: {
          category,
          percentage,
          amount,
          transactions: transactions.filter((t) => t.category === category),
        },
      });
    }
  }

  // Pattern 3: Frequent category (same category appears 2+ times for smaller datasets)
  const categoryCounts = transactions.reduce(
    (acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  for (const [category, count] of Object.entries(categoryCounts)) {
    // Lower threshold to 2 for smaller transaction sets
    if (count >= 2 && transactions.length <= 5) {
      patterns.push({
        type: "frequent_category",
        data: {
          category,
          count,
          transactions: transactions.filter((t) => t.category === category),
        },
      });
    } else if (count >= 3) {
      patterns.push({
        type: "frequent_category",
        data: {
          category,
          count,
          transactions: transactions.filter((t) => t.category === category),
        },
      });
    }
  }

  // Pattern 4: Subscription pattern (same merchant 3+ times)
  const merchantCounts = transactions.reduce(
    (acc, t) => {
      if (t.merchant_name) {
        acc[t.merchant_name] = (acc[t.merchant_name] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  for (const [merchant, count] of Object.entries(merchantCounts)) {
    if (count >= 3) {
      patterns.push({
        type: "subscription",
        data: {
          merchant_name: merchant,
          count,
          transactions: transactions.filter((t) => t.merchant_name === merchant),
        },
      });
    }
  }

  // Pattern 5: Impulse spending (multiple purchases within 1 hour)
  const sortedByTime = [...transactions].sort(
    (a, b) => new Date(a.spent_at).getTime() - new Date(b.spent_at).getTime(),
  );

  for (let i = 0; i < sortedByTime.length - 1; i++) {
    const current = new Date(sortedByTime[i].spent_at);
    const next = new Date(sortedByTime[i + 1].spent_at);
    const diffMinutes = (next.getTime() - current.getTime()) / (1000 * 60);

    if (diffMinutes <= 60 && sortedByTime[i].category === "Want" || sortedByTime[i].category === "Treat") {
      patterns.push({
        type: "impulse_spending",
        data: {
          transactions: [sortedByTime[i], sortedByTime[i + 1]],
        },
      });
      break; // Only detect first instance
    }
  }

  return patterns;
}

function getLessonTypeFromPattern(pattern: TransactionPattern): LessonTrigger | null {
  const transactions = pattern.data.transactions || [];

  switch (pattern.type) {
    case "large_purchase": {
      const t = transactions[0];
      return {
        lesson_id: "large-purchase",
        lesson_title: "Large Purchase Analysis",
        pattern,
        transactions: [t],
      };
    }
    case "category_dominance": {
      return {
        lesson_id: "category-dominance",
        lesson_title: "Spending Category Balance",
        pattern,
        transactions,
      };
    }
    case "frequent_category": {
      return {
        lesson_id: "frequent-category",
        lesson_title: "Frequent Spending Pattern",
        pattern,
        transactions,
      };
    }
    case "subscription": {
      return {
        lesson_id: "subscription-awareness",
        lesson_title: "Recurring Purchase Alert",
        pattern,
        transactions,
      };
    }
    case "impulse_spending": {
      return {
        lesson_id: "impulse-spending",
        lesson_title: "Impulse Spending Detected",
        pattern,
        transactions,
      };
    }
    default:
      return null;
  }
}

function buildTransactionContext(transactions: Transaction[]): string {
  if (transactions.length === 0) return "";

  return transactions
    .slice(0, 5)
    .map((t) => {
      const date = new Date(t.spent_at).toLocaleDateString();
      return `- $${Number(t.amount).toFixed(2)} at ${t.merchant_name || "Unknown"} (${t.category}) on ${date}`;
    })
    .join("\n");
}

function buildAIPrompt(trigger: LessonTrigger): string {
  const { pattern, transactions } = trigger;
  const context = buildTransactionContext(transactions);

  let prompt = `You are a friendly financial literacy coach for teenagers. Explain a financial concept using the user's REAL transaction data below.

User's Recent Transactions:
${context}

`;

  switch (pattern.type) {
    case "large_purchase": {
      const t = transactions[0];
      prompt += `The user just spent $${Number(t.amount).toFixed(2)} at ${t.merchant_name || "a store"} in the ${t.category} category.

Explain:
1. Whether this is a "need" or "want" and why
2. The concept of opportunity cost (what else could this money have done?)
3. How to make mindful spending decisions for large purchases

Reference the ACTUAL transaction: "You spent $${Number(t.amount).toFixed(2)} at ${t.merchant_name || "this store"}..."`;
      break;
    }
    case "category_dominance": {
      const percentage = pattern.data.percentage || 0;
      prompt += `The user is spending ${percentage.toFixed(0)}% of their money on ${pattern.data.category}.

Explain:
1. The importance of balanced spending across categories
2. Why over-spending in one area can hurt financial health
3. How to rebalance spending (50/30/20 rule: needs/wants/savings)

Reference the ACTUAL data: "You're spending ${percentage.toFixed(0)}% on ${pattern.data.category}..."`;
      break;
    }
    case "frequent_category": {
      const count = pattern.data.count || 0;
      prompt += `The user has made ${count} purchases in the ${pattern.data.category} category recently.

Explain:
1. The difference between needs and wants
2. How frequent small purchases add up
3. Strategies to reduce unnecessary spending in this category

Reference the ACTUAL pattern: "You've made ${count} ${pattern.data.category} purchases..."`;
      break;
    }
    case "subscription": {
      const merchant = pattern.data.merchant_name || "this merchant";
      const count = pattern.data.count || 0;
      prompt += `The user has made ${count} purchases at ${merchant}, suggesting a recurring subscription or habit.

Explain:
1. The hidden cost of subscriptions and recurring purchases
2. How small monthly fees add up over time
3. How to evaluate if a subscription is worth it

Reference the ACTUAL merchant: "You've purchased from ${merchant} ${count} times..."`;
      break;
    }
    case "impulse_spending": {
      const t1 = transactions[0];
      const t2 = transactions[1];
      prompt += `The user made multiple purchases within a short time period, suggesting impulse buying.

Recent purchases:
- $${Number(t1.amount).toFixed(2)} at ${t1.merchant_name || "a store"} (${t1.category})
- $${Number(t2.amount).toFixed(2)} at ${t2.merchant_name || "a store"} (${t2.category})

Explain:
1. What impulse spending is and why it happens
2. The financial impact of unplanned purchases
3. Strategies to avoid impulse buying (wait 24 hours, make a list, etc.)

Reference the ACTUAL transactions: "You spent $${Number(t1.amount).toFixed(2)} and then $${Number(t2.amount).toFixed(2)} within a short time..."`;
      break;
    }
  }

  prompt += `

Return valid JSON with this exact structure:
{
  "insight": "A short, personalized insight (2-3 sentences) referencing the actual transaction data",
  "lesson": "A detailed explanation (4-6 sentences) teaching the financial concept using the user's real data"
}

IMPORTANT: Always use "You spent $X at Y" format, never "Imagine you spent..." or generic examples.`;

  return prompt;
}

export async function generateLessonFromTransactions(
  userId: string,
  transactions: Transaction[],
): Promise<{
  lesson_id: string;
  lesson_title: string;
  insight_text: string;
  lesson_text: string;
} | null> {
  // Generate lessons if we have at least 2 transactions (for pattern detection)
  if (transactions.length < 2) {
    return null;
  }

  // Get recent transactions (last 20)
  const recentTransactions = transactions.slice(0, 20);

  // Detect patterns
  const patterns = await detectTransactionPatterns(recentTransactions);

  if (patterns.length === 0) {
    return null;
  }

  // Use the first (most significant) pattern
  const pattern = patterns[0];
  const trigger = getLessonTypeFromPattern(pattern);

  if (!trigger) {
    return null;
  }

  // Generate AI lesson
  const prompt = buildAIPrompt(trigger);

  if (!process.env.OPENAI_API_KEY) {
    // Fallback lesson
    const t = trigger.transactions[0];
    return {
      lesson_id: trigger.lesson_id,
      lesson_title: trigger.lesson_title,
      insight_text: `You spent $${Number(t.amount).toFixed(2)} at ${t.merchant_name || "a store"}. This is a good opportunity to think about whether this purchase aligns with your financial goals.`,
      lesson_text: `This purchase falls into the ${t.category} category. Consider whether this was a need or a want, and how it fits into your overall spending plan. Every purchase is a choice, and being mindful of these choices helps you build better financial habits.`,
    };
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a friendly financial literacy coach for teenagers. Always reference the user's actual transaction data. Respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const parsed = JSON.parse(content) as {
      insight?: string;
      lesson?: string;
    };

    return {
      lesson_id: trigger.lesson_id,
      lesson_title: trigger.lesson_title,
      insight_text: parsed.insight || "Your spending shows interesting patterns worth exploring.",
      lesson_text: parsed.lesson || "Understanding your spending habits helps you make better financial decisions.",
    };
  } catch (error) {
    console.error("Error generating lesson:", error);
    // Return fallback
    const t = trigger.transactions[0];
    return {
      lesson_id: trigger.lesson_id,
      lesson_title: trigger.lesson_title,
      insight_text: `You spent $${Number(t.amount).toFixed(2)} at ${t.merchant_name || "a store"}. This is a good opportunity to think about whether this purchase aligns with your financial goals.`,
      lesson_text: `This purchase falls into the ${t.category} category. Consider whether this was a need or a want, and how it fits into your overall spending plan.`,
    };
  }
}
