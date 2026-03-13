import OpenAI from "openai";

import type { Proportions } from "@/types";

const FALLBACK_MESSAGES = [
  "You're spending mostly on needs — that's a solid foundation. Try setting aside even 10% for investments to watch your city's bank tower grow.",
  "Heavy on wants right now. Your restaurant district is buzzing, but your investment tower needs some love — even small amounts compound over time.",
  "Too many treats can cloud your city with pollution. The 50/30/20 rule is a great target: 50% needs, 30% wants, 20% savings.",
  "Your investment ratio is strong — your emerald tower is climbing! Keep needs covered and you're on the right track.",
  "A balanced city has a mix of housing (needs), entertainment (wants), and a growing skyline (investments). What can you shift this week?",
];

function getFallback(proportions: Proportions): string {
  const entries = [
    { key: "needs", v: proportions.needs },
    { key: "wants", v: proportions.wants },
    { key: "treats", v: proportions.treats },
    { key: "investments", v: proportions.investments },
  ];
  const dominant = [...entries].sort((a, b) => b.v - a.v)[0];

  const map: Record<string, string> = {
    needs: FALLBACK_MESSAGES[0],
    wants: FALLBACK_MESSAGES[1],
    treats: FALLBACK_MESSAGES[2],
    investments: FALLBACK_MESSAGES[3],
  };
  return map[dominant?.key ?? "needs"] ?? FALLBACK_MESSAGES[4];
}

export async function generateInsight(proportions: Proportions): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return getFallback(proportions);
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a friendly financial coach for teenagers. Your advice is warm, short, and actionable. Relate spending to the FinQuest city metaphor: needs build housing, wants build restaurants, treats cause pollution, investments grow towers.",
        },
        {
          role: "user",
          content: `My spending breakdown this week:
- Needs (essentials): ${Math.round(proportions.needs * 100)}%
- Wants (lifestyle): ${Math.round(proportions.wants * 100)}%
- Treats (impulse): ${Math.round(proportions.treats * 100)}%
- Investments (savings): ${Math.round(proportions.investments * 100)}%

Give me 2–3 sentences of personalised advice about my city and what to do differently.`,
        },
      ],
      max_tokens: 120,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content?.trim() ?? getFallback(proportions);
  } catch {
    return getFallback(proportions);
  }
}
