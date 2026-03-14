"use client";

import { create } from "zustand";

export type QuestStatus = "active" | "completed" | "failed";

export interface Quest {
  id: string;
  title: string;
  current: number;
  target: number;
  reward: string;
  status: QuestStatus;
  category: "Need" | "Want" | "Treat" | "Invest";
}

export interface MockLesson {
  id: string;
  concept: string;
  title: string;
  previewText: string;
  category: "Need" | "Want" | "Treat" | "Invest";
}

const MOCK_LESSONS: MockLesson[] = [
  {
    id: "lesson-1",
    concept: "Needs",
    title: "Keep needs above 50%",
    previewText: "Housing, groceries, and utilities should take up about half your spending. When needs are stable, your city grows steadily.",
    category: "Need",
  },
  {
    id: "lesson-2",
    concept: "Treats",
    title: "Keep treats under 10% this week",
    previewText: "Small luxuries are fine in moderation. Too many treats create pollution in your city and hurt your long-term growth.",
    category: "Treat",
  },
  {
    id: "lesson-3",
    concept: "Invest",
    title: "Build your investment tower",
    previewText: "Every dollar you save or invest adds a brick to your future. Aim for at least 15% of spending to go to investments.",
    category: "Invest",
  },
  {
    id: "lesson-4",
    concept: "Wants",
    title: "Balance wants and needs",
    previewText: "Wants make life enjoyable but can crowd out needs. Track where your money goes and keep wants under 30%.",
    category: "Want",
  },
];

interface QuestsStore {
  quests: Quest[];
  lessons: MockLesson[];
  completedLessonIds: Set<string>;
  completeLesson: (lessonId: string) => void;
}

function createQuestFromLesson(lesson: MockLesson): Quest {
  return {
    id: `quest-${lesson.id}`,
    title: lesson.title,
    current: 0,
    target: 100,
    reward: "🏙️ Unlocks: New district",
    status: "active",
    category: lesson.category,
  };
}

export const useQuestsStore = create<QuestsStore>((set) => ({
  quests: [],
  lessons: MOCK_LESSONS,
  completedLessonIds: new Set(),

  completeLesson: (lessonId: string) => {
    set((state) => {
      if (state.completedLessonIds.has(lessonId)) return state;
      const lesson = state.lessons.find((l) => l.id === lessonId);
      if (!lesson) return state;
      const newQuest = createQuestFromLesson(lesson);
      return {
        completedLessonIds: new Set([...state.completedLessonIds, lessonId]),
        quests: [newQuest, ...state.quests],
      };
    });
  },
}));
