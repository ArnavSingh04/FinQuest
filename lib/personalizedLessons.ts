import OpenAI from "openai";
import { createSupabaseServerClient } from "@/lib/auth-server";
import type { Transaction } from "@/types";

interface LessonData {
  lesson_title: string;
  insight_text: string;
  lesson_text: string;
}

/**
 * Fetches user's recent transactions from Supabase
 */
export async function fetchUserTransactions(
  userId: string,
  limit: number = 10,
): Promise<Transaction[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("transactions")
    .select("id, user_id, amount, category, merchant_name, note, source, spent_at, created_at, updated_at")
    .eq("user_id", userId)
    .order("spent_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  return (data || []) as Transaction[];
}

/**
 * Analyzes transactions to detect spending patterns
 */
function analyzeTransactionPatterns(transactions: Transaction[]): {
  patterns: string[];
  summary: string;
} {
  if (transactions.length === 0) {
    return { patterns: [], summary: "No transactions found." };
  }

  const patterns: string[] = [];
  const totalSpent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const categoryTotals: Record<string, number> = {};
  const merchantCounts: Record<string, number> = {};
  const largePurchases: Transaction[] = [];

  transactions.forEach((t) => {
    // Category totals
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount);

    // Merchant counts
    if (t.merchant_name) {
      merchantCounts[t.merchant_name] = (merchantCounts[t.merchant_name] || 0) + 1;
    }

    // Large purchases
    if (Number(t.amount) > 80) {
      largePurchases.push(t);
    }
  });

  // Detect patterns
  if (largePurchases.length > 0) {
    const largest = largePurchases.reduce((max, t) =>
      Number(t.amount) > Number(max.amount) ? t : max,
    );
    patterns.push(
      `Large purchase: $${Number(largest.amount).toFixed(2)} at ${largest.merchant_name || "Unknown"} (${largest.category})`,
    );
  }

  // Most common category
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  if (sortedCategories.length > 0) {
    const [category, amount] = sortedCategories[0];
    const percentage = ((amount / totalSpent) * 100).toFixed(0);
    patterns.push(`Most spending: ${percentage}% on ${category} ($${amount.toFixed(2)})`);
  }

  // Repeated merchants
  const repeatedMerchants = Object.entries(merchantCounts).filter(([, count]) => count >= 2);
  if (repeatedMerchants.length > 0) {
    const [merchant, count] = repeatedMerchants[0];
    patterns.push(`Repeated merchant: ${merchant} (${count} purchases)`);
  }

  // Build summary
  const transactionList = transactions
    .slice(0, 5)
    .map(
      (t) =>
        `$${Number(t.amount).toFixed(2)} at ${t.merchant_name || "Unknown"} (${t.category}) on ${new Date(t.spent_at).toLocaleDateString()}`,
    )
    .join("\n");

  const summary = `Recent transactions:\n${transactionList}\n\nTotal spent: $${totalSpent.toFixed(2)}\nPatterns detected: ${patterns.join(", ")}`;

  return { patterns, summary };
}

/**
 * Generates a personalized financial lesson using OpenAI
 */
async function generateAILesson(
  transactions: Transaction[],
  patterns: string[],
  summary: string,
): Promise<LessonData> {
  if (!process.env.OPENAI_API_KEY) {
    // Fallback lesson
    const t = transactions[0];
    return {
      lesson_title: "Spending Analysis",
      insight_text: `You spent $${Number(t.amount).toFixed(2)} at ${t.merchant_name || "a store"}. This is a good opportunity to review your spending habits.`,
      lesson_text: `This purchase falls into the ${t.category} category. Consider whether this was a need or a want, and how it fits into your overall financial plan. Tracking your spending helps you make more mindful decisions about where your money goes.`,
    };
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const transactionDetails = transactions
    .slice(0, 10)
    .map(
      (t) =>
        `- $${Number(t.amount).toFixed(2)} at ${t.merchant_name || "Unknown"} (${t.category}) on ${new Date(t.spent_at).toLocaleDateString()}`,
    )
    .join("\n");

  const totalSpent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const avgSpent = totalSpent / transactions.length;
  const largestPurchase = transactions.reduce((max, t) =>
    Number(t.amount) > Number(max.amount) ? t : max,
  );

  const prompt = `You are a friendly financial coach for teenagers. Use the user's REAL spending data below to teach a financial concept with SPECIFIC ACTIONABLE FIGURES.

User's Recent Transactions:
${transactionDetails}

Spending Patterns Detected:
${patterns.join("\n")}

Spending Summary:
- Total spent: $${totalSpent.toFixed(2)}
- Average per transaction: $${avgSpent.toFixed(2)}
- Largest purchase: $${Number(largestPurchase.amount).toFixed(2)} at ${largestPurchase.merchant_name || "Unknown"}

Instructions:
1. Reference the ACTUAL transaction values (amounts, merchants, categories, dates)
2. Speak directly to the user using "You spent $X at Y..." format
3. NEVER use generic examples like "Imagine you spent..." or "If you spent..."
4. Include SPECIFIC ACTIONABLE FIGURES and recommendations:
   - "You could save $X per month by..."
   - "If you reduced this spending by $X, you could..."
   - "Consider spending less than $X on..."
   - "Aim to keep this category under $X..."
5. Teach ONE of these concepts based on their spending:
   - Needs vs wants
   - Impulse spending awareness
   - Opportunity cost
   - Budgeting and spending balance
   - The impact of small frequent purchases

Return valid JSON with this exact structure:
{
  "lesson_title": "A short, descriptive title (e.g., 'Large Purchase Analysis' or 'Spending Category Balance')",
  "insight_text": "A short, personalized insight (2-3 sentences) that references their actual transaction data with specific amounts. Example: 'You spent $200 at Amazon today in the Want category. This represents 69% of your recent spending.'",
  "lesson_text": "A detailed explanation (4-6 sentences) teaching the financial concept using their real data. Include specific actionable recommendations with actual dollar amounts. Example: 'You spent $200 on wants this week. Consider reducing this to $100 or less, which would save you $100 per week or $400 per month. That saved money could go toward your savings goals or future needs.' Always use 'You spent $X at Y' format, never generic examples."
}

IMPORTANT: 
- Always use actual transaction values. If they spent $200 at Amazon, say "You spent $200 at Amazon", not "imagine spending $200".
- Include specific dollar amounts in recommendations: "You could save $50", "Spend less than $100", "Reduce to $X".`;

  try {
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
      throw new Error("No response from OpenAI");
    }

    const parsed = JSON.parse(content) as {
      lesson_title?: string;
      insight_text?: string;
      lesson_text?: string;
    };

    return {
      lesson_title: parsed.lesson_title || "Spending Analysis",
      insight_text:
        parsed.insight_text ||
        `Your recent spending shows interesting patterns worth exploring.`,
      lesson_text:
        parsed.lesson_text ||
        `Understanding your spending habits helps you make better financial decisions.`,
    };
  } catch (error) {
    console.error("OpenAI error:", error);
    // Fallback lesson with specific actionable figures
    const t = transactions[0];
    const totalSpent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const suggestedReduction = (Number(t.amount) * 0.3).toFixed(2); // Suggest 30% reduction
    return {
      lesson_title: "Spending Analysis",
      insight_text: `You spent $${Number(t.amount).toFixed(2)} at ${t.merchant_name || "a store"} in the ${t.category} category. This represents part of your $${totalSpent.toFixed(2)} in recent spending.`,
      lesson_text: `This purchase falls into the ${t.category} category. Consider whether this was a need or a want. If it's a want, you could aim to spend less than $${suggestedReduction} on similar purchases, which would save you $${(Number(t.amount) - Number(suggestedReduction)).toFixed(2)} per transaction. Small changes like this add up over time and help you build better financial habits.`,
    };
  }
}

/**
 * Checks if a similar lesson already exists (to prevent duplicates)
 */
async function checkDuplicateLesson(
  userId: string,
  lessonTitle: string,
  hoursWindow: number = 24,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - hoursWindow);

  const { data, error } = await supabase
    .from("ai_insights")
    .select("id, lesson_title, created_at")
    .eq("user_id", userId)
    .eq("lesson_title", lessonTitle)
    .gte("created_at", cutoffDate.toISOString())
    .limit(1);

  if (error) {
    console.error("Error checking duplicate lesson:", error);
    return false; // If check fails, allow insertion
  }

  return (data?.length || 0) > 0;
}

/**
 * Saves lesson to ai_insights table (with duplicate prevention)
 */
async function saveLessonToDatabase(
  userId: string,
  lesson: LessonData,
  prompt: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient();

  // Check for duplicate lesson in the last 24 hours
  const isDuplicate = await checkDuplicateLesson(userId, lesson.lesson_title, 24);
  if (isDuplicate) {
    console.log("Duplicate lesson detected, skipping save");
    return; // Don't save duplicate
  }

  const { error } = await supabase.from("ai_insights").insert({
    user_id: userId,
    lesson_title: lesson.lesson_title,
    insight_text: lesson.insight_text,
    lesson_text: lesson.lesson_text,
    prompt: prompt,
    model: process.env.OPENAI_API_KEY ? "gpt-4o-mini" : "fallback",
  });

  if (error) {
    throw new Error(`Failed to save lesson: ${error.message}`);
  }
}

/**
 * Main function: Generates personalized lesson from user transactions
 */
export async function generatePersonalizedLesson(userId: string): Promise<LessonData | null> {
  try {
    // STEP 1: Fetch recent transactions
    const transactions = await fetchUserTransactions(userId, 10);

    if (transactions.length < 2) {
      return null; // Need at least 2 transactions
    }

    // STEP 2: Analyze patterns
    const { patterns, summary } = analyzeTransactionPatterns(transactions);

    if (patterns.length === 0) {
      return null; // No patterns detected
    }

    // STEP 3: Generate AI lesson
    const lesson = await generateAILesson(transactions, patterns, summary);

    // STEP 4: Save to database
    const prompt = `Generate personalized financial lesson based on: ${summary}`;
    await saveLessonToDatabase(userId, lesson, prompt);

    return lesson;
  } catch (error) {
    console.error("Error generating personalized lesson:", error);
    return null;
  }
}

/**
 * Fetches user's lessons from ai_insights table
 */
export async function getUserLessons(userId: string, limit: number = 20) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("ai_insights")
    .select("id, user_id, lesson_title, insight_text, lesson_text, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch lessons: ${error.message}`);
  }

  return data || [];
}
