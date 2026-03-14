export interface CityTier {
  name: string;
  icon: string;
  minScore: number;
  color: string;
  desc: string;
}

export const CITY_TIERS: CityTier[] = [
  { name: "Shanty Town", icon: "🏚️", minScore: 0,  color: "text-red-400",     desc: "Spending habits are hurting your city." },
  { name: "Village",     icon: "🏘️", minScore: 20, color: "text-orange-400",  desc: "A small settlement is taking shape." },
  { name: "Town",        icon: "🏙️", minScore: 40, color: "text-amber-400",   desc: "Your town is growing steadily." },
  { name: "City",        icon: "🌆", minScore: 55, color: "text-sky-400",     desc: "A proper city with real infrastructure." },
  { name: "Metropolis",  icon: "🌇", minScore: 70, color: "text-violet-400",  desc: "A thriving metropolis — impressive habits!" },
  { name: "Utopia",      icon: "✨", minScore: 88, color: "text-emerald-400", desc: "Peak financial discipline. Your city gleams." },
];

export function getCityTier(healthScore: number): CityTier {
  return [...CITY_TIERS].reverse().find((t) => healthScore >= t.minScore) ?? CITY_TIERS[0];
}

export function getStreak(transactions: { created_at?: string }[]): number {
  if (!transactions.length) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = new Set(
    transactions.map((t) => {
      const d = new Date(t.created_at ?? Date.now());
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );

  let streak = 0;
  const cursor = new Date(today);
  while (true) {
    if (days.has(cursor.getTime())) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}