"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface Lesson {
  id: string;
  lesson_id: string;
  lesson_title: string;
  insight_text: string;
  lesson_text: string;
  created_at: string;
}

interface LevelInfo {
  id: number;
  title: string;
  description: string;
  requiredLessons: number;
  topicContent: {
    introduction: string;
    sections: string[];
    keyConcepts: string[];
  };
}

const levelInfo: Record<number, LevelInfo> = {
  1: {
    id: 1,
    title: "Spending Basics",
    description: "Learn the fundamentals of tracking your money",
    requiredLessons: 1,
    topicContent: {
      introduction:
        "Understanding where your money goes is the first step to financial control. Spending basics help you see the bigger picture of your financial habits.",
      sections: [
        "Tracking your spending means writing down every purchase you make, no matter how small. This helps you see patterns in your spending behavior.",
        "Categories help organize your spending. Common categories include Needs (essential items like food and school supplies), Wants (things you enjoy but don't need), Treats (small rewards), and Investments (money that grows over time).",
        "Regular tracking helps you make better decisions. When you see where your money actually goes, you can identify areas where you might be spending too much or too little.",
        "The goal isn't to stop spending, but to spend mindfully. Every dollar you track is a dollar you're controlling, not a dollar controlling you.",
      ],
      keyConcepts: [
        "Track every transaction, no matter how small",
        "Categorize spending to see patterns",
        "Review regularly to make better decisions",
        "Mindful spending leads to financial control",
      ],
    },
  },
  2: {
    id: 2,
    title: "Needs vs Wants",
    description: "Understand the difference between essential and optional spending",
    requiredLessons: 2,
    topicContent: {
      introduction:
        "Every purchase falls into one of two categories: needs or wants. Understanding this difference is crucial for making smart financial decisions.",
      sections: [
        "Needs are things you must have to survive and function: food, shelter, clothing, school supplies, and basic healthcare. These are non-negotiable expenses.",
        "Wants are things you'd like to have but can live without: video games, designer clothes, eating out, entertainment subscriptions, and luxury items.",
        "The line between needs and wants can be blurry. For example, you need food, but eating at a fancy restaurant is a want. You need clothes, but designer brands are wants.",
        "A good rule: if you can't function without it, it's a need. If it makes life more enjoyable but isn't essential, it's a want. Balancing both is key to financial health.",
      ],
      keyConcepts: [
        "Needs = essential for survival and function",
        "Wants = improve life but aren't necessary",
        "The line can be blurry - use judgment",
        "Balance both for financial health",
      ],
    },
  },
  3: {
    id: 3,
    title: "Budgeting Basics",
    description: "Master the art of planning your spending",
    requiredLessons: 3,
    topicContent: {
      introduction:
        "A budget is a plan for your money. It helps you decide how much to spend on different things before you actually spend it, preventing overspending and ensuring you have money for what matters most.",
      sections: [
        "The 50/30/20 rule is a simple budgeting framework: 50% for needs, 30% for wants, and 20% for savings. This ensures you cover essentials while still enjoying life and building for the future.",
        "Start by tracking your income (allowance, part-time job, gifts) and expenses. Then allocate your money according to your priorities. Your budget should reflect your values and goals.",
        "Budgets aren't meant to restrict you - they give you freedom. When you know you've set aside money for fun, you can enjoy spending it without guilt.",
        "Review and adjust your budget regularly. As your income or priorities change, your budget should too. A budget is a living document, not a rigid rule.",
      ],
      keyConcepts: [
        "50/30/20 rule: needs/wants/savings",
        "Budget = plan for your money",
        "Budgets give freedom, not restriction",
        "Review and adjust regularly",
      ],
    },
  },
  4: {
    id: 4,
    title: "Smart Saving",
    description: "Build your financial safety net",
    requiredLessons: 3,
    topicContent: {
      introduction:
        "Saving money is like building a safety net for your future. It protects you from emergencies, helps you reach big goals, and gives you financial peace of mind.",
      sections: [
        "Start small - even saving $5 or $10 a week adds up. The key is consistency. Set up automatic transfers or put money aside as soon as you receive it, before you have a chance to spend it.",
        "Have different savings goals: emergency fund (for unexpected expenses), short-term goals (like a new phone or concert tickets), and long-term goals (like college or a car).",
        "The 'pay yourself first' principle means saving before spending. Treat savings like a bill you must pay. This ensures you always save something, even if it's small.",
        "Compound interest is your friend. When you save money in an account that earns interest, you earn interest on your interest. The earlier you start, the more time your money has to grow.",
      ],
      keyConcepts: [
        "Start small, be consistent",
        "Multiple savings goals",
        "Pay yourself first",
        "Compound interest grows your money",
      ],
    },
  },
  5: {
    id: 5,
    title: "Investment Fundamentals",
    description: "Grow your money over time",
    requiredLessons: 4,
    topicContent: {
      introduction:
        "Investing is using your money to make more money over time. Unlike saving (which keeps your money safe), investing puts your money to work, though it comes with some risk.",
      sections: [
        "The stock market represents ownership in companies. When you buy stocks, you own a small piece of that company. If the company does well, your investment grows.",
        "Diversification means spreading your investments across different types of assets (stocks, bonds, savings accounts). This reduces risk - if one investment loses value, others might gain.",
        "Time is your greatest advantage. The longer you invest, the more time your money has to grow through compound interest. Starting early, even with small amounts, makes a huge difference.",
        "Risk and return go hand in hand. Higher potential returns usually come with higher risk. Understanding your risk tolerance helps you choose investments that match your comfort level.",
      ],
      keyConcepts: [
        "Investing = money making money",
        "Diversification reduces risk",
        "Time is your advantage",
        "Risk and return are connected",
      ],
    },
  },
  6: {
    id: 6,
    title: "Credit & Debt",
    description: "Navigate borrowing responsibly",
    requiredLessons: 4,
    topicContent: {
      introduction:
        "Credit allows you to borrow money with a promise to pay it back later. Used wisely, it can help you build wealth. Used poorly, it can trap you in debt.",
      sections: [
        "Good debt helps you build something valuable: student loans for education, a mortgage for a home, or a business loan. These investments typically increase in value over time.",
        "Bad debt is money borrowed for things that lose value: credit card debt for unnecessary purchases, payday loans, or financing things you can't afford. This debt costs you more than it's worth.",
        "Credit scores show lenders how trustworthy you are. Paying bills on time, keeping debt low, and having a history of responsible borrowing builds a good score. A good score gets you better interest rates.",
        "The golden rule: never borrow more than you can pay back. If you can't afford to pay cash for something, you probably can't afford the debt either. Live within your means.",
      ],
      keyConcepts: [
        "Good debt builds value",
        "Bad debt loses value",
        "Credit scores matter",
        "Never borrow more than you can repay",
      ],
    },
  },
  7: {
    id: 7,
    title: "Advanced Planning",
    description: "Long-term financial strategies",
    requiredLessons: 5,
    topicContent: {
      introduction:
        "Advanced financial planning involves thinking beyond today. It's about setting long-term goals, understanding how your decisions today affect your future, and building wealth over time.",
      sections: [
        "Set SMART goals: Specific, Measurable, Achievable, Relevant, and Time-bound. Instead of 'save money,' say 'save $500 for a new laptop by December.' Clear goals are easier to achieve.",
        "Understand opportunity cost: every dollar you spend is a dollar you can't invest. Before making a purchase, ask: 'What else could this money do for me?' This helps prioritize spending.",
        "Build multiple income streams. Don't rely on one source of income. Side hustles, investments, and skills that generate money create financial security and freedom.",
        "Think long-term. Small decisions today compound over time. Saving $50 a month might seem small, but over 10 years with interest, it becomes significant. Start early, think big.",
      ],
      keyConcepts: [
        "SMART goals are achievable",
        "Opportunity cost matters",
        "Multiple income streams = security",
        "Small decisions compound over time",
      ],
    },
  },
};

export default function LevelPage() {
  const router = useRouter();
  const params = useParams();
  const levelId = Number(params.id);
  const level = levelInfo[levelId as keyof typeof levelInfo];
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [readLessons, setReadLessons] = useState<Set<string>>(new Set());
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showPersonalizedSection, setShowPersonalizedSection] = useState(false);

  useEffect(() => {
    // Check if level is locked
    if (levelId > 1) {
      const prevLevelCompleted =
        typeof window !== "undefined" &&
        localStorage.getItem(`level-${levelId - 1}-completed`) === "true";
      if (!prevLevelCompleted) {
        router.push("/lessons");
        return;
      }
    }

    // Check if already completed
    const isCompleted =
      typeof window !== "undefined" &&
      localStorage.getItem(`level-${levelId}-completed`) === "true";
    if (isCompleted) {
      setShowCompletionModal(true);
    }

    // Load read lessons
    const read = new Set<string>();
    if (typeof window !== "undefined") {
      // Check all localStorage keys for this level
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(`lesson-read-${levelId}-`)) {
          const lessonId = key.replace(`lesson-read-${levelId}-`, "");
          read.add(lessonId);
        }
      }
      // Check if level is already completed
      const isCompleted = localStorage.getItem(`level-${levelId}-completed`) === "true";
      if (isCompleted && read.size >= level.requiredLessons) {
        setTimeout(() => setShowCompletionModal(true), 500);
      }
    }
    setReadLessons(read);

    async function loadLessons() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/lessons");

        if (!response.ok) {
          throw new Error("Unable to load lessons.");
        }

        const data = await response.json();
        // Remove duplicates by lesson ID
        const uniqueLessons = Array.from(
          new Map((data.lessons || []).map((lesson: Lesson) => [lesson.id, lesson])).values(),
        );
        setLessons(uniqueLessons);
        
        // Show personalized section if there are lessons
        if (uniqueLessons.length > 0) {
          setShowPersonalizedSection(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load lessons.");
      } finally {
        setIsLoading(false);
      }
    }

    loadLessons();

    // Only auto-refresh if there are no lessons (to catch newly generated ones)
    // Once lessons exist, stop auto-refreshing to prevent constant updates
    let interval: NodeJS.Timeout | null = null;
    let hasLessons = false;
    
    const checkAndRefresh = async () => {
      const response = await fetch("/api/lessons");
      if (response.ok) {
        const data = await response.json();
        const uniqueLessons = Array.from(
          new Map((data.lessons || []).map((l: Lesson) => [l.id, l])).values(),
        );
        if (uniqueLessons.length > 0) {
          hasLessons = true;
          if (interval) {
            clearInterval(interval);
            interval = null;
          }
        }
      }
    };

    // Only start interval if we don't have lessons yet
    if (lessons.length === 0) {
      interval = setInterval(checkAndRefresh, 10000); // Check every 10 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [levelId, router, level]);

  function toggleLesson(id: string) {
    setExpandedLessons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        // Mark as read when expanded
        if (typeof window !== "undefined") {
          localStorage.setItem(`lesson-read-${levelId}-${id}`, "true");
          setReadLessons((prev) => {
            const updated = new Set(prev).add(id);
            // Check completion after state update
            setTimeout(() => {
              if (updated.size >= level.requiredLessons) {
                localStorage.setItem(`level-${levelId}-completed`, "true");
                setShowCompletionModal(true);
              }
            }, 100);
            return updated;
          });
        }
      }
      return next;
    });
  }

  function handleContinue() {
    setShowCompletionModal(false);
    if (levelId < 7) {
      router.push(`/lessons/level/${levelId + 1}`);
    } else {
      router.push("/lessons");
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  if (!level) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-2xl px-5 py-10">
        <div className="glass-card rounded-[2rem] p-6 text-center">
          <h1 className="text-2xl font-semibold text-white">Level not found</h1>
          <button
            onClick={() => router.push("/lessons")}
            className="mt-4 rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950"
          >
            Back to Lessons
          </button>
        </div>
      </main>
    );
  }

  const progress = Math.min((readLessons.size / level.requiredLessons) * 100, 100);

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-5 py-10">
      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <button
          onClick={() => router.push("/lessons")}
          className="mb-4 flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Lessons
        </button>

        <div className="glass-card rounded-2xl border border-white/10 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-emerald-400 text-lg font-bold text-slate-950">
              {level.id}
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
                Level {level.id}
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">
                {level.title}
              </h1>
            </div>
          </div>
          <p className="text-slate-300">{level.description}</p>

          {/* Progress */}
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-slate-400">Progress</span>
              <span className="font-semibold text-white">
                {readLessons.size} / {level.requiredLessons} lessons read
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-sky-400 to-emerald-400"
              />
            </div>
          </div>
        </div>
      </motion.section>

      {/* Topic Introduction Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card mb-6 rounded-2xl border border-white/10 p-6"
      >
        <h2 className="mb-4 text-2xl font-semibold text-white">{level.title}</h2>
        <p className="mb-6 leading-7 text-slate-300">{level.topicContent.introduction}</p>

        {/* Key Sections */}
        <div className="space-y-4">
          {level.topicContent.sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="rounded-xl border border-white/5 bg-slate-950/30 p-4"
            >
              <p className="leading-7 text-slate-300">{section}</p>
            </motion.div>
          ))}
        </div>

        {/* Key Concepts */}
        <div className="mt-6 rounded-xl border border-sky-400/20 bg-sky-950/20 p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-sky-300">
            Key Concepts
          </h3>
          <ul className="space-y-2">
            {level.topicContent.keyConcepts.map((concept, index) => (
              <li key={index} className="flex items-start gap-3 text-sm text-slate-300">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-400/20 text-xs font-semibold text-sky-300">
                  {index + 1}
                </span>
                <span>{concept}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.section>

      {/* Manual Completion Button - Always visible */}
      {readLessons.size < level.requiredLessons && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card mb-6 rounded-2xl border border-sky-400/30 bg-sky-950/20 p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Complete This Level</h3>
              <p className="mt-1 text-sm text-slate-300">
                {readLessons.size < level.requiredLessons
                  ? `Read ${level.requiredLessons - readLessons.size} more lesson${level.requiredLessons - readLessons.size > 1 ? "s" : ""} to complete, or mark as complete manually.`
                  : "You can mark this level as complete."}
              </p>
            </div>
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.setItem(`level-${levelId}-completed`, "true");
                  setShowCompletionModal(true);
                }
              }}
              className="rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:shadow-lg hover:shadow-sky-400/30 sm:shrink-0"
            >
              Mark Complete
            </button>
          </div>
        </motion.div>
      )}

      {/* Personalized Lessons Section */}
      {showPersonalizedSection && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-sky-400/50 to-transparent" />
            <h2 className="text-xl font-semibold text-white">Your Personalized Lessons</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-sky-400/50 to-transparent" />
          </div>
          <p className="mb-4 text-center text-sm text-slate-400">
            Based on your actual spending patterns and transactions
          </p>
        </motion.section>
      )}

      {/* Lessons Feed */}
      {isLoading ? (
        <div className="glass-card rounded-2xl p-6 text-center">
          <p className="text-slate-300">Loading your personalized lessons...</p>
        </div>
      ) : error ? (
        <div className="glass-card rounded-2xl border border-rose-400/20 bg-rose-950/20 p-6 text-sm text-rose-300">
          {error}
        </div>
      ) : lessons.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800/50">
            <svg
              className="h-8 w-8 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white">No personalized lessons yet</h2>
          <p className="mt-2 text-slate-300">
            Start logging transactions to receive personalized financial lessons based on your
            actual spending patterns.
          </p>
          <p className="mt-4 text-sm text-slate-400">
            You can still complete this level by using the "Mark Complete" button above.
          </p>
          <div className="mt-4 space-y-3">
            <button
              onClick={async () => {
                try {
                  setIsLoading(true);
                  setError(null);
                  const response = await fetch("/api/lessons/generate", { method: "POST" });
                  const data = await response.json();
                  if (response.ok) {
                    // Reload lessons
                    const lessonsResponse = await fetch("/api/lessons");
                    const lessonsData = await lessonsResponse.json();
                    setLessons(lessonsData.lessons || []);
                    setShowPersonalizedSection(true);
                    // Show success message
                    setError(null);
                  } else {
                    setError(data.error || "Failed to generate lesson");
                  }
                } catch (err) {
                  setError("Failed to generate lesson. Please try again.");
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
              className="w-full rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:shadow-lg hover:shadow-sky-400/30 disabled:opacity-50"
            >
              {isLoading ? "Generating Lesson..." : "Generate Lesson from My Transactions"}
            </button>
            <button
              onClick={async () => {
                setIsLoading(true);
                setError(null);
                try {
                  const response = await fetch("/api/lessons");
                  if (response.ok) {
                    const data = await response.json();
                    setLessons(data.lessons || []);
                    if (data.lessons && data.lessons.length > 0) {
                      setShowPersonalizedSection(true);
                    }
                  }
                } catch (err) {
                  setError("Failed to refresh lessons.");
                } finally {
                  setIsLoading(false);
                }
              }}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-900/50"
            >
              Refresh Lessons
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {lessons.map((lesson, index) => {
              const isExpanded = expandedLessons.has(lesson.id);
              const isRead = readLessons.has(lesson.id);

              return (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`glass-card overflow-hidden rounded-2xl border-2 transition ${
                    isRead
                      ? "border-emerald-400/30 bg-emerald-950/10"
                      : "border-white/10 hover:border-sky-400/30"
                  }`}
                >
                  <button
                    onClick={() => toggleLesson(lesson.id)}
                    className="w-full p-6 text-left"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="rounded-full bg-gradient-to-r from-sky-400/20 to-emerald-400/20 px-3 py-1 text-xs font-semibold text-sky-300">
                            {lesson.lesson_title}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatDate(lesson.created_at)}
                          </span>
                          {isRead && (
                            <span className="flex items-center gap-1 text-xs text-emerald-300">
                              <svg
                                className="h-3 w-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Read
                            </span>
                          )}
                        </div>
                        <h3 className="mb-2 text-lg font-semibold text-white">
                          {lesson.insight_text}
                        </h3>
                        {!isExpanded && (
                          <p className="text-sm text-slate-400">Tap to learn more →</p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <div className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                          +10 XP
                        </div>
                        <motion.svg
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          className="h-5 w-5 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </motion.svg>
                      </div>
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-white/10 bg-slate-950/30 p-6">
                          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-sky-300">
                            Personalized Lesson
                          </h4>
                          <p className="leading-7 text-slate-300">{lesson.lesson_text}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Completion Modal */}
      <AnimatePresence>
        {showCompletionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm"
            onClick={() => setShowCompletionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card w-full max-w-md rounded-[2rem] p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600"
              >
                <svg
                  className="h-10 w-10 text-slate-950"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </motion.div>

              <h2 className="mb-3 text-3xl font-semibold text-white">Level Complete!</h2>
              <p className="mb-6 text-slate-300">
                Congratulations! You've completed <span className="font-semibold text-sky-300">{level.title}</span>.
                {levelId < 7
                  ? " You can now access the next level."
                  : " You've completed all available levels!"}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCompletionModal(false);
                    router.push("/lessons");
                  }}
                  className="flex-1 rounded-2xl border border-white/10 bg-slate-950/50 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-900/50"
                >
                  Back to Map
                </button>
                {levelId < 7 && (
                  <button
                    onClick={handleContinue}
                    className="flex-1 rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:shadow-lg hover:shadow-sky-400/30"
                  >
                    Next Level
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
