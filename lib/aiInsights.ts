import OpenAI from "openai";

import type { SpendingRatios } from "@/types";

function buildFallbackInsight(ratios: SpendingRatios) {
  const strongestHabit =
    [
      { label: "needs", value: ratios.needs_ratio },
      { label: "wants", value: ratios.wants_ratio },
      { label: "treats", value: ratios.treat_ratio },
      { label: "investing", value: ratios.invest_ratio },
    ].sort((a, b) => b.value - a.value)[0]?.label ?? "balanced spending";

  return `Your biggest pattern right now is ${strongestHabit}. Try keeping needs first, limiting impulse treats, and putting a small part of every week into investing so your city keeps growing.`;
}

export async function generateInsightFromRatios(ratios: SpendingRatios) {
  if (!process.env.OPENAI_API_KEY) {
    return buildFallbackInsight(ratios);
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content:
          "You are a friendly financial coach for teenagers. Keep advice short, practical, and non-judgmental.",
      },
      {
        role: "user",
        content: `Explain the user's spending pattern to a teenager and provide simple financial advice.

Spending ratios:
- Needs: ${ratios.needs_ratio}
- Wants: ${ratios.wants_ratio}
- Treats: ${ratios.treat_ratio}
- Invest: ${ratios.invest_ratio}

Return 2 to 3 sentences max.`,
      },
    ],
  });

  return response.output_text || buildFallbackInsight(ratios);
}
