import type { ReactNode } from "react";

interface StatsCardProps {
  label: string;
  value: string;
  helperText?: string;
  accent?: string;
  icon?: ReactNode;
}

export function StatsCard({
  label,
  value,
  helperText,
  accent = "from-sky-400/30 to-emerald-400/10",
  icon,
}: StatsCardProps) {
  return (
    <article className="glass-card rounded-3xl p-4">
      <div
        className={`mb-4 rounded-2xl bg-gradient-to-br ${accent} p-3 text-slate-100`}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-slate-100/80">{label}</p>
          <div className="text-sm">{icon}</div>
        </div>
        <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      </div>
      {helperText ? (
        <p className="text-sm leading-6 text-slate-300">{helperText}</p>
      ) : null}
    </article>
  );
}
