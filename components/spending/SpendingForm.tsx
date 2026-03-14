"use client";

import { useState, useCallback } from "react";
import { useCityStore } from "@/store/useCityStore";
import { deriveCityFinance, generateAdvice, type FinancialAdvice } from "@/lib/cityFinanceModel";
import type { TransactionApiResponse, TransactionCategory } from "@/types";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CategoryConfig {
  label: TransactionCategory;
  icon: string;
  cityEffect: string;
  tip: string;
  borderActive: string;
  bgActive: string;
  textActive: string;
  reward: string; // what the city shows
}

interface TransactionRecord {
  id: number;
  category: TransactionCategory;
  amount: string;
  icon: string;
  ts: number;
}

// ─── Config ────────────────────────────────────────────────────────────────────

const CATEGORIES: CategoryConfig[] = [
  {
    label: "Need", icon: "🏗️",
    cityEffect: "Roads, schools & hospitals grow",
    tip: "Needs are your city's backbone. Every dollar here adds roads, schools and hospitals.",
    borderActive: "border-green-400", bgActive: "bg-green-500/20", textActive: "text-green-100",
    reward: "📈 Infrastructure boosts",
  },
  {
    label: "Invest", icon: "📈",
    cityEffect: "Skyscrapers shoot upward!",
    tip: "Investments are the BIGGEST tower boost. Compound interest = skyscrapers over time!",
    borderActive: "border-blue-400", bgActive: "bg-blue-500/20", textActive: "text-blue-100",
    reward: "🏙️ Towers grow tallest",
  },
  {
    label: "Treat", icon: "🌳",
    cityEffect: "Parks, gyms & gardens appear",
    tip: "Treats build resilience! Parks and gyms make your city greener and more liveable.",
    borderActive: "border-purple-400", bgActive: "bg-purple-500/20", textActive: "text-purple-100",
    reward: "🌿 City gets greener",
  },
  {
    label: "Want", icon: "🎮",
    cityEffect: "Neon & entertainment — careful!",
    tip: "Wants add fun, but excess causes smog and meteor strikes on your towers! Keep under 15%.",
    borderActive: "border-orange-400", bgActive: "bg-orange-500/20", textActive: "text-orange-100",
    reward: "☄️ Excess = destruction!",
  },
];

const WISDOM: Record<TransactionCategory, string[]> = {
  Need:   ["Smart! Essentials first keeps your city stable. 🏗️","Needs are the foundation of good finances.","Strong move — infrastructure spending pays for itself."],
  Invest: ["Your towers are growing! Compound interest will make them soar. 📈","Every investment now = skyscrapers later!","Genius move. Consistent investing builds real wealth."],
  Treat:  ["Parks are blooming! Wellbeing spending makes your city resilient. 🌳","Self-investment pays off in health and happiness.","Green spaces = happy city. Great balance!"],
  Want:   ["Fun is important, but keep wants under 15% to avoid meteor strikes! 🎮","Balance wants with needs. Too much neon = city chaos!","Enjoy life — just make sure essentials come first."],
};

const RANGE_OPTIONS = [
  { label: "Under $10",  value: 8,   short: "$<10" },
  { label: "$10 – $15", value: 12.5, short: "$10" },
  { label: "$15 – $25", value: 20,   short: "$20" },
  { label: "$25 – $35", value: 30,   short: "$30" },
  { label: "$35 – $50", value: 42,   short: "$42" },
  { label: "Over $50",  value: 65,   short: "$65" },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function AdviceCard({ advice }: { advice: FinancialAdvice }) {
  const colors: Record<FinancialAdvice["priority"], { bg: string; border: string; text: string; badge: string }> = {
    critical: { bg:"bg-red-950/60",    border:"border-red-500/50",    text:"text-red-200",    badge:"bg-red-800/80 text-red-200" },
    warning:  { bg:"bg-amber-950/60",  border:"border-amber-500/50",  text:"text-amber-200",  badge:"bg-amber-800/80 text-amber-200" },
    good:     { bg:"bg-sky-950/60",    border:"border-sky-500/50",    text:"text-sky-200",    badge:"bg-sky-800/80 text-sky-200" },
    great:    { bg:"bg-emerald-950/60",border:"border-emerald-500/50",text:"text-emerald-200",badge:"bg-emerald-800/80 text-emerald-200" },
  };
  const c = colors[advice.priority];
  return (
    <div className={`rounded-xl border p-3 ${c.bg} ${c.border}`}>
      <div className="flex items-start gap-2.5">
        <span className="text-xl flex-shrink-0 mt-0.5">{advice.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className={`text-sm font-semibold ${c.text}`}>{advice.title}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase ${c.badge}`}>
              {advice.priority}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-5 mb-1">{advice.message}</p>
          <p className={`text-xs font-medium ${c.text} opacity-80`}>→ {advice.action}</p>
        </div>
      </div>
    </div>
  );
}

function SpendingBar({ label, ratio, ideal, color, icon }: {
  label: string; ratio: number; ideal: number; color: string; icon: string;
}) {
  const pct = Math.round(ratio * 100);
  const idealPct = Math.round(ideal * 100);
  const diff = pct - idealPct;
  const status = Math.abs(diff) <= 6 ? "on-target" : diff > 0 ? "over" : "under";
  const statusColors = { "on-target":"text-emerald-400", over:"text-red-400", under:"text-amber-400" };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{icon}</span>
          <span className="text-xs font-medium text-slate-300">{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-bold ${statusColors[status]}`}>{pct}%</span>
          <span className="text-[10px] text-slate-500">/ {idealPct}% ideal</span>
        </div>
      </div>
      <div className="relative h-3 rounded-full bg-slate-800 overflow-hidden">
        {/* Ideal marker */}
        <div className="absolute top-0 h-full w-0.5 bg-white/25 z-10" style={{ left:`${idealPct}%` }} />
        {/* Fill */}
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width:`${Math.min(pct, 100)}%`, background:color }}
        />
      </div>
    </div>
  );
}

function HistoryItem({ record }: { record: TransactionRecord }) {
  const catColors: Record<TransactionCategory, string> = {
    Need:"text-green-400", Invest:"text-blue-400", Treat:"text-purple-400", Want:"text-orange-400",
  };
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0">
      <span className="text-base w-6 text-center flex-shrink-0">{record.icon}</span>
      <span className={`text-xs font-medium flex-1 ${catColors[record.category]}`}>{record.category}</span>
      <span className="text-xs text-slate-300 font-mono">{record.amount}</span>
      <span className="text-[10px] text-slate-500">
        {new Date(record.ts).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}
      </span>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

interface SpendingFormProps {
  onTransactionProcessed?: (response: TransactionApiResponse) => Promise<void> | void;
}

export function SpendingForm({ onTransactionProcessed }: SpendingFormProps) {
  const setCityMetrics    = useCityStore(s => s.setCityMetrics);
  const setFinanceMetrics = useCityStore(s => s.setFinanceMetrics);
  const setSkyMode        = useCityStore(s => s.setSkyMode);
  const financeMetrics    = useCityStore(s => s.financeMetrics);

  const [rangeIdx,      setRangeIdx]      = useState(0);
  const [category,      setCategory]      = useState<TransactionCategory>("Need");
  const [submitting,    setSubmitting]     = useState(false);
  const [wisdomMsg,     setWisdomMsg]      = useState<string | null>(null);
  const [history,       setHistory]        = useState<TransactionRecord[]>([]);
  const [activeTab,     setActiveTab]      = useState<"log"|"stats"|"advice">("log");
  const [transCount,    setTransCount]     = useState(0);

  const finance = deriveCityFinance(financeMetrics);
  const advice  = generateAdvice(finance);
  const activeCat = CATEGORIES.find(c => c.label === category)!;

  // Spending ratios for the bar chart
  const bars = [
    { label:"Needs",   icon:"🏗️", ratio:finance.needsRatio,  ideal:0.50, color:"#22c55e" },
    { label:"Invest",  icon:"📈", ratio:finance.investRatio, ideal:0.20, color:"#3b82f6" },
    { label:"Treats",  icon:"🌳", ratio:finance.treatsRatio, ideal:0.20, color:"#a78bfa" },
    { label:"Wants",   icon:"🎮", ratio:finance.wantsRatio,  ideal:0.10, color:"#f97316" },
  ];

  const healthColor =
    finance.balanceScore >= 80 ? "#22c55e" :
    finance.balanceScore >= 60 ? "#3b82f6" :
    finance.balanceScore >= 40 ? "#f59e0b" : "#ef4444";

  const healthLabel =
    finance.balanceScore >= 80 ? "Thriving" :
    finance.balanceScore >= 60 ? "Healthy"  :
    finance.balanceScore >= 40 ? "Strained" : "At Risk";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setWisdomMsg(null);

    try {
      const range = RANGE_OPTIONS[rangeIdx];
      const res = await fetch("/api/transaction", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ amount:range.value, category }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? "Failed"); }

      const payload = await res.json() as TransactionApiResponse;
      setCityMetrics(payload.cityMetrics);
      setFinanceMetrics({
        needs:       payload.ratios.needs_ratio * 100,
        wants:       payload.ratios.wants_ratio * 100,
        investments: payload.ratios.invest_ratio * 100,
        assets:      payload.ratios.treat_ratio * 100,
      });
      localStorage.setItem("finquest-ratios",       JSON.stringify(payload.ratios));
      localStorage.setItem("finquest-city-metrics", JSON.stringify(payload.cityMetrics));
      await onTransactionProcessed?.(payload);

      // Update history
      const msgs = WISDOM[category];
      setWisdomMsg(msgs[Math.floor(Math.random() * msgs.length)]);
      setTransCount(c => c + 1);
      setHistory(h => [{
        id: Date.now(), category, icon: activeCat.icon,
        amount: range.label, ts: Date.now(),
      }, ...h].slice(0, 20));

      setSkyMode(category === "Want" ? "night" : "day");
    } catch (err) {
      setWisdomMsg(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  const criticalAdvice = advice.filter(a => a.priority === "critical");

  return (
    <div className="glass-card rounded-[2rem] p-5 sm:p-6 flex flex-col gap-4">
      {/* Header + health badge */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">FinQuest</p>
          <h2 className="mt-0.5 text-xl font-semibold text-white leading-tight">Shape your city</h2>
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color:healthColor, background:`${healthColor}22` }}>
            {healthLabel} · {finance.balanceScore}/100
          </span>
          {transCount > 0 && <span className="text-[10px] text-slate-500">{transCount} transaction{transCount>1?"s":""}</span>}
        </div>
      </div>

      {/* Critical alerts banner */}
      {criticalAdvice.length > 0 && (
        <div className="rounded-xl border border-red-500/40 bg-red-950/40 px-3 py-2 flex items-center gap-2">
          <span>{criticalAdvice[0].icon}</span>
          <p className="text-xs text-red-300 font-medium leading-4">{criticalAdvice[0].title} — {criticalAdvice[0].action}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-900/60 p-1">
        {(["log","stats","advice"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all capitalize
              ${activeTab===tab ? "bg-sky-500/30 text-sky-200 border border-sky-500/40" : "text-slate-400 hover:text-slate-200"}`}
          >
            {tab === "log" ? "📝 Log" : tab === "stats" ? "📊 Stats" : "💡 Advice"}
            {tab === "advice" && advice.filter(a=>a.priority==="critical"||a.priority==="warning").length > 0 && (
              <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-red-400" />
            )}
          </button>
        ))}
      </div>

      {/* ── LOG TAB ─────────────────────────────────────────────────── */}
      {activeTab === "log" && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Amount range */}
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-300 uppercase tracking-widest">Amount range</span>
            <select value={rangeIdx} onChange={e=>setRangeIdx(Number(e.target.value))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400">
              {RANGE_OPTIONS.map((o,i) => <option key={o.label} value={i}>{o.label}</option>)}
            </select>
          </label>

          {/* Category buttons */}
          <div>
            <span className="mb-1.5 block text-xs font-medium text-slate-300 uppercase tracking-widest">Category</span>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(cat => {
                const active = cat.label === category;
                return (
                  <button key={cat.label} type="button"
                    onClick={() => { setCategory(cat.label); setSkyMode(cat.label==="Want"?"night":"day"); }}
                    className={`rounded-xl border px-3 py-2.5 text-left transition-all duration-200
                      ${active ? `${cat.borderActive} ${cat.bgActive} ${cat.textActive}` : "border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/20"}`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-base leading-none">{cat.icon}</span>
                      <span className="text-xs font-semibold">{cat.label}</span>
                    </div>
                    <p className="text-[10px] opacity-65 leading-3.5">{active ? cat.cityEffect : cat.reward}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active tip */}
          <div className={`rounded-xl border px-3 py-2 text-[11px] leading-5 ${activeCat.bgActive} ${activeCat.borderActive} ${activeCat.textActive} opacity-90`}>
            {activeCat.icon} {activeCat.tip}
          </div>

          {/* Submit */}
          <button type="submit" disabled={submitting}
            className="w-full rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-400 px-4 py-3.5 text-sm font-semibold text-slate-950 transition disabled:opacity-50 hover:opacity-90 active:scale-[0.98]">
            {submitting ? "Updating City…" : `Submit ${activeCat.icon} Transaction`}
          </button>

          {/* Wisdom toast */}
          {wisdomMsg && (
            <div className="rounded-xl bg-slate-800/60 border border-white/10 px-3.5 py-2.5 text-sm leading-6 text-slate-200">
              {wisdomMsg}
            </div>
          )}

          {/* Recent history mini-list */}
          {history.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Recent</p>
              {history.slice(0, 5).map(r => <HistoryItem key={r.id} record={r} />)}
            </div>
          )}
        </form>
      )}

      {/* ── STATS TAB ───────────────────────────────────────────────── */}
      {activeTab === "stats" && (
        <div className="flex flex-col gap-4">
          {/* Health ring + score */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <svg width="64" height="64" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="#1e293b" strokeWidth="8" />
                <circle cx="32" cy="32" r="26" fill="none" stroke={healthColor} strokeWidth="8"
                  strokeDasharray={`${finance.balanceScore * 1.634} 163.4`}
                  strokeLinecap="round" transform="rotate(-90 32 32)"
                  style={{ transition:"stroke-dasharray 1s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-white">{finance.balanceScore}</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{healthLabel} City</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-5">Balanced spending = higher score. Aim for 80+.</p>
              <p className="text-[10px] text-slate-500 mt-1">{transCount} transaction{transCount!==1?"s":""} logged</p>
            </div>
          </div>

          {/* Spending bars */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 flex flex-col gap-3">
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Spending breakdown</p>
            {bars.map(b => <SpendingBar key={b.label} {...b} />)}
            <p className="text-[10px] text-slate-500 mt-1">White line = ideal target. Aim to align your bars.</p>
          </div>

          {/* City metrics */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label:"Tower height", value:Math.round(finance.heightMultiplier*100)+"%", icon:"🏙️",
                sub: finance.investScore > 0.15 ? "Investments soaring!" : "Invest more!" },
              { label:"Road quality",  value:Math.round(finance.infrastructureHealth*100)+"%" , icon:"🛣️",
                sub: finance.infrastructureHealth > 0.6 ? "Smooth streets" : "Needs help" },
              { label:"Green spaces",  value:Math.round(finance.resilience*100)+"%",            icon:"🌳",
                sub: finance.resilience > 0.5 ? "Thriving parks" : "Plant more trees" },
              { label:"Air quality",   value:Math.round((1-finance.pollutionLevel)*100)+"%",    icon:"💨",
                sub: finance.pollutionLevel < 0.2 ? "Crystal clear" : "Smoggy city!" },
            ].map(m => (
              <div key={m.label} className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">{m.icon}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide">{m.label}</span>
                </div>
                <p className="text-lg font-bold text-white">{m.value}</p>
                <p className="text-[10px] text-slate-500">{m.sub}</p>
              </div>
            ))}
          </div>

          {/* Full history */}
          {history.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2 max-h-40 overflow-y-auto">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5 sticky top-0 bg-transparent">All transactions</p>
              {history.map(r => <HistoryItem key={r.id} record={r} />)}
            </div>
          )}
        </div>
      )}

      {/* ── ADVICE TAB ──────────────────────────────────────────────── */}
      {activeTab === "advice" && (
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-white/10 bg-slate-950/30 px-3.5 py-3">
            <p className="text-xs text-slate-400 leading-5">
              Your advisor analyses your spending mix and tells you exactly how to grow your city.
              Follow the suggestions below to unlock a golden skyline!
            </p>
          </div>

          {advice.length === 0 ? (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-4 text-center">
              <p className="text-2xl mb-1">🌟</p>
              <p className="text-sm font-semibold text-emerald-300">Perfect balance!</p>
              <p className="text-xs text-slate-400 mt-1">Keep logging transactions to maintain your golden city.</p>
            </div>
          ) : (
            advice.map((a, i) => <AdviceCard key={i} advice={a} />)
          )}

          {/* 50/20/20/10 guide */}
          <div className="rounded-xl border border-sky-500/30 bg-sky-950/30 p-3.5">
            <p className="text-xs font-semibold text-sky-300 mb-2">🎯 The Golden Rule: 50/20/20/10</p>
            {[
              { pct:"50%", cat:"Needs",  desc:"Rent, food, transport, utilities",  color:"#22c55e" },
              { pct:"20%", cat:"Invest", desc:"Savings, super, shares, assets",    color:"#3b82f6" },
              { pct:"20%", cat:"Treats", desc:"Health, education, self-care",      color:"#a78bfa" },
              { pct:"10%", cat:"Wants",  desc:"Entertainment, dining, shopping",   color:"#f97316" },
            ].map(r => (
              <div key={r.cat} className="flex items-center gap-2 py-1">
                <span className="text-xs font-bold w-8" style={{ color:r.color }}>{r.pct}</span>
                <span className="text-xs font-semibold text-slate-200 w-14">{r.cat}</span>
                <span className="text-[11px] text-slate-400">{r.desc}</span>
              </div>
            ))}
          </div>

          {/* Sky/demolition guide */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3">
            <p className="text-xs font-semibold text-amber-300 mb-1.5">🌦️ What your sky tells you</p>
            {[
              { sky:"☀️ Clear blue",  msg:"Balanced — city thriving" },
              { sky:"🌅 Golden hour", msg:"Investments are strong!" },
              { sky:"🌫️ Hazy",       msg:"Wants spending is high" },
              { sky:"⛈️ Stormy",     msg:"Danger — reduce wants now" },
              { sky:"☄️ Meteors",    msg:"Wants overload — towers crumbling!" },
            ].map(s => (
              <div key={s.sky} className="flex items-center gap-2 py-0.5">
                <span className="text-xs w-24 flex-shrink-0">{s.sky}</span>
                <span className="text-[11px] text-slate-400">{s.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}