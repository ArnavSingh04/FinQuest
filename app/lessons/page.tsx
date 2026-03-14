"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useUser, hasSupabaseEnv } from "@/lib/auth";

interface Level {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  locked: boolean;
  requiredLessons: number; // Number of lessons needed to complete this level
}

const levels: Level[] = [
  {
    id: 1,
    title: "Spending Basics",
    description: "Learn the fundamentals of tracking your money",
    completed: false,
    locked: false,
    requiredLessons: 1,
  },
  {
    id: 2,
    title: "Needs vs Wants",
    description: "Understand the difference between essential and optional spending",
    completed: false,
    locked: true,
    requiredLessons: 2,
  },
  {
    id: 3,
    title: "Budgeting Basics",
    description: "Master the art of planning your spending",
    completed: false,
    locked: true,
    requiredLessons: 3,
  },
  {
    id: 4,
    title: "Smart Saving",
    description: "Build your financial safety net",
    completed: false,
    locked: true,
    requiredLessons: 3,
  },
  {
    id: 5,
    title: "Investment Fundamentals",
    description: "Grow your money over time",
    completed: false,
    locked: true,
    requiredLessons: 4,
  },
  {
    id: 6,
    title: "Credit & Debt",
    description: "Navigate borrowing responsibly",
    completed: false,
    locked: true,
    requiredLessons: 4,
  },
  {
    id: 7,
    title: "Advanced Planning",
    description: "Long-term financial strategies",
    completed: false,
    locked: true,
    requiredLessons: 5,
  },
];

function LevelCard({ level, index }: { level: Level; index: number }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isCompleted =
    mounted &&
    typeof window !== "undefined" &&
    localStorage.getItem(`level-${level.id}-completed`) === "true";

  const isLocked = level.id > 1 && !localStorage.getItem(`level-${level.id - 1}-completed`);

  return (
    <Link
      href={isLocked ? "#" : `/lessons/level/${level.id}`}
      className={`block ${isLocked ? "cursor-not-allowed opacity-50" : ""}`}
      onClick={(e) => {
        if (isLocked) {
          e.preventDefault();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`glass-card relative overflow-hidden rounded-2xl border-2 p-6 transition-all ${
          isCompleted
            ? "border-emerald-400/50 bg-emerald-950/20"
            : isLocked
              ? "border-slate-700 bg-slate-900/30"
              : "border-white/10 bg-slate-950/50 hover:border-sky-400/50 hover:bg-slate-900/50"
        }`}
      >
        {/* Level number badge */}
        <div className="mb-4 flex items-center justify-between">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ${
              isCompleted
                ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950"
                : isLocked
                  ? "bg-slate-800 text-slate-500"
                  : "bg-gradient-to-br from-sky-400 to-emerald-400 text-slate-950"
            }`}
          >
            {isCompleted ? (
              <svg
                className="h-6 w-6"
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
            ) : isLocked ? (
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            ) : (
              level.id
            )}
          </div>
          {isLocked && (
            <span className="text-xs font-semibold text-slate-500">Locked</span>
          )}
        </div>

        <h3 className="mb-2 text-xl font-semibold text-white">{level.title}</h3>
        <p className="text-sm text-slate-400">{level.description}</p>

        {isCompleted && (
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-300">
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
                d="M5 13l4 4L19 7"
              />
            </svg>
            Completed
          </div>
        )}
      </motion.div>
    </Link>
  );
}

export default function LessonsPage() {
  const { user } = useUser();
  const [completedLevels, setCompletedLevels] = useState<Set<number>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load completed levels from localStorage
    const completed = new Set<number>();
    for (let i = 1; i <= 7; i++) {
      if (typeof window !== "undefined" && localStorage.getItem(`level-${i}-completed`) === "true") {
        completed.add(i);
      }
    }
    setCompletedLevels(completed);
  }, []);

  const completionRate = mounted ? Math.round((completedLevels.size / levels.length) * 100) : 0;

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-5 py-10">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
          Financial Literacy
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Lessons
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-300">
          Master financial concepts step by step. Complete each level to unlock the next one.
        </p>
      </motion.section>

      {/* Completion Rate */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card mb-8 rounded-2xl border border-white/10 p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Overall Progress</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {completionRate}% Complete
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {completedLevels.size} of {levels.length} levels completed
            </p>
          </div>
          <div className="relative h-20 w-20">
            <svg className="h-20 w-20 -rotate-90 transform">
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-slate-800"
              />
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="url(#gradient)"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 36}`}
                strokeDashoffset={`${2 * Math.PI * 36 * (1 - completionRate / 100)}`}
                className="transition-all duration-500"
              />
            </svg>
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-white">{completionRate}%</span>
            </div>
          </div>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionRate}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-sky-400 to-emerald-400"
          />
        </div>
      </motion.div>

      {/* Levels Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {levels.map((level, index) => (
          <LevelCard key={level.id} level={level} index={index} />
        ))}

        {/* Coming Soon Level */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card relative overflow-hidden rounded-2xl border-2 border-slate-700 bg-slate-900/30 p-6 opacity-60"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-lg font-bold text-slate-500">
            8+
          </div>
          <h3 className="mb-2 text-xl font-semibold text-slate-500">Coming Soon</h3>
          <p className="text-sm text-slate-600">
            More levels are on the way. Keep learning!
          </p>
        </motion.div>
      </div>
    </main>
  );
}
