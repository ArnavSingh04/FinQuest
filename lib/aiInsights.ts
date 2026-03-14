import OpenAI from "openai";

import { getPrimaryLesson } from "@/lib/financialConcepts";
import type { AIInsightPayload, UserMetrics } from "@/types";

function buildFallbackInsight(metrics: UserMetrics): AIInsightPayload {
  const lesson = getPrimaryLesson(metrics);
  const strongestHabit =
    [
      { label: "needs", value: metrics.ratios.needs_ratio },
      { label: "wants", value: metrics.ratios.wants_ratio },
      { label: "treats", value: metrics.ratios.treat_ratio },
      { label: "investing", value: metrics.ratios.invest_ratio },
    ].sort((a, b) => b.value - a.value)[0]?.label ?? "balanced spending";

  return {
    insight: `Your biggest pattern right now is ${strongestHabit}. Keep your essentials steady, avoid too many impulse treats, and keep investing a little at a time so your city economy stays healthy.`,
    lesson,
  };
}

export async function generateFinancialInsight(
  userMetrics: UserMetrics,
): Promise<AIInsightPayload> {
  const fallback = buildFallbackInsight(userMetrics);

  if (!process.env.OPENAI_API_KEY) {
    return fallback;
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You are a friendly financial literacy coach for teenagers. Respond with concise JSON only.",
        },
        {
          role: "user",
          content: `Explain the user's spending behavior in simple terms suitable for teenagers.
Provide one actionable improvement suggestion.
Use these metrics:
- Needs ratio: ${userMetrics.ratios.needs_ratio}
- Wants ratio: ${userMetrics.ratios.wants_ratio}
- Treat ratio: ${userMetrics.ratios.treat_ratio}
- Invest ratio: ${userMetrics.ratios.invest_ratio}
- Economy score: ${userMetrics.cityMetrics.economyScore}
- Pollution: ${userMetrics.cityMetrics.pollution}
- Infrastructure: ${userMetrics.cityMetrics.infrastructure}
- Growth: ${userMetrics.cityMetrics.growth}
- Liquidity: ${userMetrics.cityMetrics.liquidity}
- Stability: ${userMetrics.cityMetrics.stability}

Return valid JSON shaped exactly like:
{"insight":"...", "lesson":"..."}`,
        },
      ],
    });

    const rawText = response.output_text?.trim();

    if (!rawText) {
      return fallback;
    }

    const parsed = JSON.parse(rawText) as {
      insight?: string;
      lesson?: string;
    };

    return {
      insight: parsed.insight || fallback.insight,
      lesson: {
        ...fallback.lesson,
        lessonText: parsed.lesson || fallback.lesson.lessonText,
      },
    };
  } catch {
    return fallback;
  }
}
