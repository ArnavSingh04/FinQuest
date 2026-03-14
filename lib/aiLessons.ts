import OpenAI from "openai";

import type { LessonTrigger, Transaction, UserMetrics } from "@/types";

export interface LessonGenerationContext {
  trigger: LessonTrigger;
  userMetrics: UserMetrics;
  recentTransactions: Transaction[];
}

export interface GeneratedLessonDraft {
  title: string;
  concept: string;
  previewText: string;
  explanation: string;
  examples: string[];
  advice: string[];
  generatedBy: string;
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function buildPreviewText(explanation: string) {
  const firstSentence = explanation.split(".")[0]?.trim();
  const preview = firstSentence || explanation.trim();

  if (preview.length <= 120) {
    return preview;
  }

  return `${preview.slice(0, 117).trim()}...`;
}

function getRecentSpendSharePercent(transaction: Transaction, transactions: Transaction[]) {
  const totalSpent = transactions.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );

  if (totalSpent <= 0) {
    return 0;
  }

  return (Number(transaction.amount || 0) / totalSpent) * 100;
}

function formatTransactionReference(transaction: Transaction, transactions: Transaction[]) {
  const label = transaction.merchant_name?.trim() || `${transaction.category} purchase`;
  const sharePercent = getRecentSpendSharePercent(transaction, transactions);

  return `${label} (${transaction.category}, ${formatPercent(sharePercent)} of recent spend)`;
}

function pickTransactions(
  transactions: Transaction[],
  preferredCategories: Transaction["category"][] = [],
) {
  const filtered =
    preferredCategories.length > 0
      ? transactions.filter((transaction) =>
          preferredCategories.includes(transaction.category),
        )
      : transactions;

  return (filtered.length > 0 ? filtered : transactions).slice(0, 2);
}

function sanitizeStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 4);

  return items.length > 0 ? items : fallback;
}

function parseJsonObject(rawText: string) {
  const normalized = rawText
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");

  return JSON.parse(normalized) as Record<string, unknown>;
}

function buildFallbackExamples(context: LessonGenerationContext) {
  const { trigger, recentTransactions, userMetrics } = context;

  switch (trigger.id) {
    case "high-treat-ratio": {
      const treatRefs = pickTransactions(recentTransactions, ["Treat", "Want"]).map(
        (transaction) => formatTransactionReference(transaction, recentTransactions),
      );

      return [
        treatRefs.length > 0
          ? `Recent fun spending like ${treatRefs.join(" and ")} shows how small impulse purchases can quietly stack up.`
          : "Your recent spending includes enough fun purchases to make treat money a noticeable part of your budget.",
        `Right now, treats make up ${Math.round(userMetrics.ratios.treat_ratio * 100)}% of your tracked spending, which can crowd out future goals if it keeps growing.`,
      ];
    }
    case "low-investment-activity": {
      const spendingRefs = pickTransactions(recentTransactions, ["Want", "Treat", "Need"]).map(
        (transaction) => formatTransactionReference(transaction, recentTransactions),
      );

      return [
        spendingRefs.length > 0
          ? `Transactions like ${spendingRefs.join(" and ")} show money leaving your account today without much being set aside for future growth.`
          : "Your recent activity shows spending happening now, but very little being directed toward future growth.",
        `Investing is only ${Math.round(userMetrics.ratios.invest_ratio * 100)}% of your tracked spending, so even a tiny regular amount would shift the pattern.`,
      ];
    }
    case "low-liquidity": {
      const liquidityRefs = pickTransactions(recentTransactions).map((transaction) =>
        formatTransactionReference(transaction, recentTransactions),
      );

      return [
        liquidityRefs.length > 0
          ? `Recent payments such as ${liquidityRefs.join(" and ")} are normal, but they still require enough cash flexibility to handle surprise costs.`
          : "Your recent spending pattern suggests money is moving out quickly without leaving much short-term cushion.",
        `A liquidity score of ${userMetrics.scores.liquidity}/100 means one unexpected expense could feel more stressful than it should.`,
      ];
    }
    case "strong-investment-habits": {
      const investRefs = pickTransactions(recentTransactions, ["Invest"]).map(
        (transaction) => formatTransactionReference(transaction, recentTransactions),
      );

      return [
        investRefs.length > 0
          ? `Recent investing actions like ${investRefs.join(" and ")} show that you are already building a future-focused habit.`
          : "Your recent behavior shows a healthy habit of putting money toward future growth.",
        `An investment growth score of ${userMetrics.scores.investmentGrowth}/100 suggests your consistency is starting to matter.`,
      ];
    }
    case "balanced-behavior": {
      return [
        `Your mix of needs, wants, treats, and investing is staying close to balance, with budget health at ${userMetrics.scores.budgetHealth}/100.`,
        `That balance helps your city stay stable instead of swinging between overspending and over-restricting yourself.`,
      ];
    }
    case "budget-imbalance":
    default: {
      return [
        `Your current mix is ${Math.round(userMetrics.ratios.needs_ratio * 100)}% needs, ${Math.round(userMetrics.ratios.wants_ratio * 100)}% wants, ${Math.round(userMetrics.ratios.treat_ratio * 100)}% treats, and ${Math.round(userMetrics.ratios.invest_ratio * 100)}% investing.`,
        `With budget health at ${userMetrics.scores.budgetHealth}/100, the numbers suggest one category is pulling your plan off balance.`,
      ];
    }
  }
}

function buildFallbackAdvice(context: LessonGenerationContext) {
  const { trigger } = context;

  switch (trigger.id) {
    case "high-treat-ratio":
      return [
        "Set a weekly treat cap before you spend.",
        "Wait 24 hours before buying non-essential items over a small threshold.",
        "Move one treat purchase this week into savings or investing instead.",
      ];
    case "low-investment-activity":
      return [
        "Pick a tiny starter amount you can invest or save every week.",
        "Treat future-you like a bill that gets paid regularly.",
        "Start small and focus on consistency instead of waiting for a perfect amount.",
      ];
    case "low-liquidity":
      return [
        "Build a small emergency buffer before adding more fun spending.",
        "Keep a little money uncommitted after each week of spending.",
        "Reduce one optional purchase category until your cash cushion feels safer.",
      ];
    case "strong-investment-habits":
      return [
        "Keep the habit automatic so you do not need motivation every time.",
        "Protect this routine even during weeks with more fun spending.",
        "Celebrate the consistency, not just the amount.",
      ];
    case "balanced-behavior":
      return [
        "Keep using the same balance instead of drifting upward in lifestyle spending.",
        "Check your mix weekly so small changes do not become habits.",
        "Use any extra money to strengthen savings or investing first.",
      ];
    case "budget-imbalance":
    default:
      return [
        "Pick one category to trim slightly instead of changing everything at once.",
        "Use a simple target like the 50/30/20 rule to guide your next week.",
        "Review your last few purchases and spot which pattern repeats most often.",
      ];
  }
}

function buildFallbackLesson(context: LessonGenerationContext): GeneratedLessonDraft {
  const { trigger, userMetrics } = context;

  const explanationByTrigger: Record<string, string> = {
    "high-treat-ratio":
      "Fun spending is part of life, but when treat purchases become a big share of your money, they can quietly steal room from goals that matter more later.",
    "low-investment-activity":
      "Investing does not have to start big. The real skill is learning to send a little money toward future-you before all of it gets used today.",
    "low-liquidity":
      "Liquidity means having enough flexible money available when life surprises you. A stronger cash buffer makes everyday spending feel less risky.",
    "strong-investment-habits":
      "You are already showing a healthy future-focused habit. The lesson now is understanding why consistency matters more than chasing perfect timing.",
    "balanced-behavior":
      "A balanced money routine means your budget is doing several jobs at once: covering essentials, leaving room for fun, and still protecting your future.",
    "budget-imbalance":
      "A budget gets easier to manage when each category stays in proportion. When one area grows too fast, the rest of your plan has to work harder.",
  };

  const explanation =
    explanationByTrigger[trigger.id] ||
    "Your recent activity points to a money habit that is worth understanding a little better.";

  return {
    title: trigger.concept,
    concept: trigger.concept,
    previewText: buildPreviewText(explanation),
    explanation,
    examples: buildFallbackExamples(context),
    advice: buildFallbackAdvice(context),
    generatedBy: "fallback",
  };
}

export async function generatePersonalizedLesson(
  context: LessonGenerationContext,
): Promise<GeneratedLessonDraft> {
  const fallback = buildFallbackLesson(context);

  if (!process.env.OPENAI_API_KEY) {
    return fallback;
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const transactionsForPrompt = context.recentTransactions.slice(0, 8).map((transaction) => ({
    merchant_name: transaction.merchant_name ?? null,
    category: transaction.category,
    share_of_recent_spend_pct: Math.round(
      getRecentSpendSharePercent(transaction, context.recentTransactions),
    ),
    note: transaction.note ?? null,
    spent_at: transaction.spent_at ?? transaction.created_at ?? null,
  }));

  try {
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You are a financial literacy coach helping teenagers and young users understand money habits. Use simple language, avoid jargon, and return JSON only.",
        },
        {
          role: "user",
          content: `Generate one short personalized finance lesson.

Trigger:
${JSON.stringify(context.trigger, null, 2)}

Financial metrics:
${JSON.stringify(context.userMetrics, null, 2)}

Recent transactions:
${JSON.stringify(transactionsForPrompt, null, 2)}

Requirements:
- Keep the lesson practical and short.
- Connect the lesson to the user's real spending behavior.
- Mention specific examples from the transaction list when possible.
- When you mention numbers from the user's transactions, use percentages instead of currency amounts.
- Give advice the user could act on this week.
- Do not invent transactions that are not present.
- Use simple language for young users.

Return valid JSON with exactly this shape:
{
  "title": "short lesson title",
  "concept": "financial concept name",
  "explanation": "2-4 sentence explanation",
  "examples": ["example 1", "example 2"],
  "advice": ["advice 1", "advice 2", "advice 3"]
}`,
        },
      ],
    });

    const rawText = response.output_text?.trim();

    if (!rawText) {
      return fallback;
    }

    const parsed = parseJsonObject(rawText);
    const explanation =
      typeof parsed.explanation === "string" && parsed.explanation.trim()
        ? parsed.explanation.trim()
        : fallback.explanation;

    return {
      title:
        typeof parsed.title === "string" && parsed.title.trim()
          ? parsed.title.trim()
          : fallback.title,
      concept:
        typeof parsed.concept === "string" && parsed.concept.trim()
          ? parsed.concept.trim()
          : fallback.concept,
      previewText: buildPreviewText(explanation),
      explanation,
      examples: sanitizeStringArray(parsed.examples, fallback.examples),
      advice: sanitizeStringArray(parsed.advice, fallback.advice),
      generatedBy: "gpt-4.1-mini",
    };
  } catch {
    return fallback;
  }
}
