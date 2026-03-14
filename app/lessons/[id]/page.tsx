"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface LessonContent {
  id: number;
  title: string;
  concept: string;
  content: string[];
  examples: string[];
}

const lessonData: Record<number, LessonContent> = {
  1: {
    id: 1,
    title: "Profit & Loss",
    concept: "profit and loss",
    content: [
      "Profit and Loss (P&L) is one of the most fundamental concepts in finance. Simply put, it tells you whether you're making money or losing money.",
      "Profit happens when you earn more than you spend. For example, if you sell lemonade for $10 but only spent $3 on ingredients, you made a profit of $7!",
      "Loss happens when you spend more than you earn. If you bought a video game for $60 but only used it once and never played it again, that's a loss of $60.",
      "Understanding profit and loss helps you make smarter decisions about how you spend your money. Always think: 'Will this purchase bring me value, or will it be a loss?'",
      "In FinQuest, every transaction you log affects your city. Smart spending (profit) helps your city grow, while wasteful spending (loss) can slow down your progress.",
    ],
    examples: [
      "Buying a textbook for school = Profit (helps you learn)",
      "Buying snacks you'll eat = Neutral (sustains you)",
      "Buying something you never use = Loss (wasted money)",
    ],
  },
  2: {
    id: 2,
    title: "Budgeting",
    concept: "budgeting",
    content: [
      "A budget is like a plan for your money. It helps you decide how much you can spend on different things before you actually spend it.",
      "Think of your budget as a pie. You need to divide it into slices: some for needs (like food and school supplies), some for wants (like entertainment), and some for savings.",
      "The 50/30/20 rule is a simple way to budget: 50% for needs, 30% for wants, and 20% for savings. This ensures you always have money for what matters most.",
      "Tracking your spending helps you stick to your budget. When you see where your money goes, you can make better choices about where it should go instead.",
      "In FinQuest, your spending ratios show how well you're following a budget. A balanced city means you're budgeting wisely!",
    ],
    examples: [
      "Monthly allowance: $100",
      "Needs (50%): $50 for lunch, supplies",
      "Wants (30%): $30 for games, movies",
      "Savings (20%): $20 for future goals",
    ],
  },
  3: {
    id: 3,
    title: "Savings",
    concept: "savings",
    content: [
      "Savings is money you set aside for the future instead of spending it right now. It's like planting a seed that will grow into something bigger later.",
      "Why save? Emergencies happen. Your phone might break, or you might need money for something important. Having savings means you're prepared.",
      "Savings also help you reach big goals. Want a new bike? A gaming console? Saving a little each week gets you there faster than you think.",
      "The key to saving is consistency. Even saving $5 a week adds up to $260 in a year! Small amounts become big amounts over time.",
      "In FinQuest, your savings ratio affects your city's stability. The more you save, the stronger and more resilient your city becomes.",
    ],
    examples: [
      "Save $10/week = $520/year",
      "Save $20/week = $1,040/year",
      "Save $50/week = $2,600/year",
    ],
  },
  4: {
    id: 4,
    title: "Investing",
    concept: "investing",
    content: [
      "Investing is using your money to make more money over time. Instead of keeping money in a piggy bank, you put it somewhere it can grow.",
      "Think of investing like planting a tree. You water it (invest money), and over years, it grows bigger and gives you fruit (returns). The longer you wait, the bigger it gets.",
      "Stocks, bonds, and savings accounts are common ways to invest. Each has different risks and rewards. Stocks can grow fast but can also go down. Savings accounts are safe but grow slowly.",
      "The magic of investing is compound interest. Your money earns money, and then that money earns money too! It's like a snowball rolling downhill, getting bigger.",
      "In FinQuest, your investment ratio shows how much you're thinking long-term. Higher investments mean your city grows faster and becomes more prosperous.",
    ],
    examples: [
      "Invest $100 at 5% interest = $105 after 1 year",
      "Invest $100 at 5% for 10 years = $163",
      "Start early: $100/month from age 16 = $50,000+ by age 30",
    ],
  },
  5: {
    id: 5,
    title: "Credit & Debt",
    concept: "credit and debt",
    content: [
      "Credit is the ability to borrow money with a promise to pay it back later. Debt is the money you owe. Understanding both is crucial for financial health.",
      "Good debt helps you build something valuable. Student loans for education or a loan for a car you need for work are examples of good debt.",
      "Bad debt is money borrowed for things that lose value quickly. Credit card debt for things you can't afford is bad debt because it costs you more in interest.",
      "Credit scores matter. They show lenders how trustworthy you are. Paying bills on time, not borrowing too much, and having a history of responsible borrowing builds a good score.",
      "In FinQuest, managing debt wisely keeps your city stable. Too much debt (bad spending) creates pollution and instability, while smart borrowing (investments) helps growth.",
    ],
    examples: [
      "Good debt: Student loan for education",
      "Bad debt: Credit card for unnecessary purchases",
      "Rule: Never borrow more than you can pay back",
    ],
  },
};

export default function LessonDetailPage() {
  const router = useRouter();
  const params = useParams();
  const lessonId = Number(params.id);
  const lesson = lessonData[lessonId as keyof typeof lessonData];
  const [showCongrats, setShowCongrats] = useState(false);
  const [hasRead, setHasRead] = useState(false);

  useEffect(() => {
    // Check if lesson is already completed
    if (typeof window !== "undefined") {
      const isCompleted = localStorage.getItem(`lesson-${lessonId}-completed`) === "true";
      if (isCompleted) {
        setHasRead(true);
      }
    }
  }, [lessonId]);

  if (!lesson) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-4xl px-5 py-10">
        <div className="glass-card rounded-[2rem] p-6 text-center">
          <h1 className="text-2xl font-semibold text-white">Lesson not found</h1>
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

  function handleComplete() {
    if (typeof window !== "undefined") {
      localStorage.setItem(`lesson-${lessonId}-completed`, "true");
      setShowCongrats(true);
      setHasRead(true);
    }
  }

  function handleCloseCongrats() {
    setShowCongrats(false);
    router.push("/lessons");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-5 py-10">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-[2rem] p-6 sm:p-10"
      >
        {/* Header */}
        <div className="mb-8">
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

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-emerald-400 text-lg font-semibold text-slate-950">
              {lesson.id}
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
                Level {lesson.id}
              </p>
              <h1 className="mt-1 text-3xl font-semibold text-white sm:text-4xl">
                {lesson.title}
              </h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {lesson.content.map((paragraph, index) => (
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="text-base leading-7 text-slate-300"
            >
              {paragraph}
            </motion.p>
          ))}

          {/* Examples section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: lesson.content.length * 0.1 }}
            className="mt-8 rounded-2xl border border-sky-400/20 bg-slate-950/50 p-6"
          >
            <h3 className="mb-4 text-lg font-semibold text-sky-300">Examples</h3>
            <ul className="space-y-3">
              {lesson.examples.map((example, index) => (
                <li key={index} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-400/20 text-xs font-semibold text-sky-300">
                    {index + 1}
                  </span>
                  <span>{example}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Complete button */}
        <div className="mt-10 flex justify-center">
          <motion.button
            onClick={handleComplete}
            disabled={hasRead}
            className={`rounded-2xl px-8 py-4 text-sm font-semibold transition ${
              hasRead
                ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-sky-400 to-emerald-400 text-slate-950 hover:shadow-lg hover:shadow-sky-400/30"
            }`}
            whileHover={!hasRead ? { scale: 1.05 } : {}}
            whileTap={!hasRead ? { scale: 0.95 } : {}}
          >
            {hasRead ? "✓ Lesson Completed" : "Mark as Complete"}
          </motion.button>
        </div>
      </motion.section>

      {/* Congratulations Modal */}
      <AnimatePresence>
        {showCongrats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm"
            onClick={handleCloseCongrats}
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

              <h2 className="mb-3 text-3xl font-semibold text-white">Congratulations!</h2>
              <p className="mb-6 text-slate-300">
                You've completed <span className="font-semibold text-sky-300">{lesson.title}</span>
                ! You now understand the basics of {lesson.concept}.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleCloseCongrats}
                  className="flex-1 rounded-2xl border border-white/10 bg-slate-950/50 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-900/50"
                >
                  Continue Learning
                </button>
                <button
                  onClick={() => {
                    handleCloseCongrats();
                    if (lessonId < 5) {
                      router.push(`/lessons/${lessonId + 1}`);
                    }
                  }}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:shadow-lg hover:shadow-sky-400/30"
                >
                  {lessonId < 5 ? "Next Lesson" : "Back to Map"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
