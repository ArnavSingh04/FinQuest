"use client";

import { useMemo } from "react";
import { useGameStore } from "@/store/useGameStore";

const SLICES = [
  { key: "needs"       as const, label: "Needs",   color: "#38bdf8", emptyColor: "#0c4a6e" },
  { key: "wants"       as const, label: "Wants",   color: "#fb923c", emptyColor: "#7c2d12" },
  { key: "treats"      as const, label: "Treats",  color: "#f472b6", emptyColor: "#831843" },
  { key: "investments" as const, label: "Invest",  color: "#34d399", emptyColor: "#064e3b" },
];

function polarToCart(cx: number, cy: number, r: number, angle: number) {
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const [sx, sy] = polarToCart(cx, cy, r, startAngle);
  const [ex, ey] = polarToCart(cx, cy, r, endAngle);
  const large = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey} Z`;
}

export function SpendingDonut() {
  const { proportions, transactions } = useGameStore();

  const slices = useMemo(() => {
    const total = proportions.needs + proportions.wants + proportions.treats + proportions.investments;
    if (total === 0) return [];
    let angle = -Math.PI / 2;
    return SLICES.map((s) => {
      const frac = proportions[s.key];
      const sweep = frac * Math.PI * 2;
      const start = angle;
      angle += sweep;
      return { ...s, frac, start, end: angle, midAngle: start + sweep / 2 };
    }).filter((s) => s.frac > 0.01);
  }, [proportions]);

  if (transactions.length === 0) return null;

  const cx = 80; const cy = 80; const R = 60; const rInner = 36;
  const total = transactions.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="glass-card rounded-3xl p-5">
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">Spending Mix</p>
      <div className="flex items-center gap-4">
        <div className="shrink-0">
          <svg width="160" height="160" viewBox="0 0 160 160">
            {slices.map((s) => (
              <path
                key={s.key}
                d={arcPath(cx, cy, R, s.start, s.end)}
                fill={s.color}
                opacity={0.9}
              />
            ))}
            {/* Inner hole */}
            <circle cx={cx} cy={cy} r={rInner} fill="#0d1829" />
            {/* Centre label */}
            <text x={cx} y={cy - 6} textAnchor="middle" fontSize="11" fill="#94a3b8" fontFamily="sans-serif">total</text>
            <text x={cx} y={cy + 10} textAnchor="middle" fontSize="14" fontWeight="bold" fill="white" fontFamily="sans-serif">
              ${total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total.toFixed(0)}
            </text>
          </svg>
        </div>
        <div className="flex-1 flex flex-col gap-2">
          {SLICES.map((s) => {
            const pct = Math.round(proportions[s.key] * 100);
            return (
              <div key={s.key} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-xs text-slate-400 flex-1">{s.label}</span>
                <span className="text-xs font-bold text-white">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
