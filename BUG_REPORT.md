# FinQuest Bug Report

Audit date: 2026-03-15
Branch: `Fresh_start_testing`
Fixed in commit: `309bb40`

---

## Summary

| # | Severity | File | Description | Status |
|---|---|---|---|---|
| 1 | High | `app/history/page.tsx` | History page showed wrong health score, weather, and population | Fixed |
| 2 | High | `app/history/page.tsx` | Resetting data did not clear the city/game state | Fixed |
| 3 | Medium | `store/useGameStore.ts` | Advisor message loaded with JSON double-quotes after refresh | Fixed |
| 4 | Medium | `lib/financeEngine.ts` | Spending ratios truncated to 2 decimal places, causing score drift | Fixed |
| 5 | Low | `lib/cityShare.ts` | Shared city proportions could decode to sum ≠ 1.0 | Fixed |

---

## Bug 1 — History page showed wrong health score, weather, and population

**File:** `app/history/page.tsx` (lines 33–65, 190–207)
**Severity:** High — user-visible wrong data

### What was happening

The history page had three helper functions that invented their own stats instead of using the real engine:

**Wrong health score:**
```typescript
// BEFORE — average of 3 unrelated scores, nothing to do with the city's health
const healthScore = Math.round(
  (dashboard.scores.budgetHealth +
    dashboard.scores.stability +
    dashboard.cityMetrics.economyScore) / 3,
);
```
The actual health score is computed by `calculateHealthScore(proportions)` in `lib/cityEngine.ts`. The history page's formula produced a completely different number — someone could have a health score of 82 on the city page but see 61 on the history page.

**Wrong weather:**
```typescript
// BEFORE — invented labels that don't exist in the city system
function getWeatherLabel(payload) {
  if (payload.cityMetrics.emergencyWarning) return "Storm";
  if (payload.cityMetrics.pollution >= 70)  return "Smog";     // "Smog" doesn't exist
  if (growth >= 70 && pollution <= 30)       return "Sunny";    // "Sunny" doesn't exist
  if (stability >= 60)                       return "Clear";
  return "Cloudy";                                               // "Cloudy" doesn't exist
}
```
The city uses `thriving / clear / overcast / rain / storm / destruction` from `mapHealthToWeather()`. The history page showed "Sunny" while the city showed "Overcast", with no connection between the two.

**Wrong population:**
```typescript
// BEFORE — made-up formula using cityMetrics
const estimate = Math.max(18, Math.round(
  (growth * 1400 + infrastructure * 900 + stability * 700) / 1000
));
return `${estimate}k`;  // e.g. "1.8k"
```
The actual population is `Math.floor(healthScore / 10)` from `cityEngine.ts`. For a health score of 70, the city showed "7K" but the history page could show "1.8k" — a 4× difference.

### Why it was a bug

The history page was operating as a completely separate stats system with its own formulas, creating data that contradicted the city. Any user who opened history after playing would see numbers that didn't match what they were used to.

### Fix

Removed all three custom functions. The history page now:
1. Converts `dashboard.ratios` to `Proportions` format
2. Calls `calculateHealthScore(proportions)` — the same function the city uses
3. Calls `mapHealthToWeather(healthScore)` for the weather label
4. Uses `Math.floor(healthScore / 10)` for population — exactly how `cityEngine.generateCityState` does it

```typescript
// AFTER
const r = dashboard.ratios;
const proportions = { needs: r.needs_ratio, wants: r.wants_ratio, treats: r.treat_ratio, investments: r.invest_ratio };
const healthScore = Math.round(calculateHealthScore(proportions));
const weather = mapHealthToWeather(healthScore);
const population = Math.floor(healthScore / 10);
```

---

## Bug 2 — Resetting data did not clear the city/game state

**File:** `app/history/page.tsx` (lines 235–239)
**Severity:** High — misleading UX after reset

### What was happening

After a successful `DELETE /api/transaction`, the history page wrote to three localStorage keys:

```typescript
// BEFORE — writing to OLD keys that nothing reads
localStorage.setItem("finquest-ratios",       JSON.stringify(payload.ratios));
localStorage.setItem("finquest-city-metrics", JSON.stringify(payload.cityMetrics));
localStorage.setItem("finquest-progress",     JSON.stringify(payload.progress));
```

The main game store (`useGameStore`) uses entirely different keys: `fq-transactions`, `fq-proportions`, `fq-city-state`, etc. Writing to `finquest-*` had zero effect on the store.

**Result:** The user clicked "Reset all data", saw the history page clear, then navigated back to the city page — and their old city was still fully intact with all buildings and stats, as if nothing happened. The reset appeared broken.

### Why it was a bug

The history page was written early in development when the localStorage keys were `finquest-*`. The game store was later refactored to use `fq-*` keys, but the history page was never updated. The two systems fell out of sync silently.

### Fix

Replaced the three stale `localStorage.setItem` calls with a single `clearAll()` call on the game store, which correctly wipes all `fq-*` keys and resets the Zustand state:

```typescript
// AFTER
const clearGameStore = useGameStore((s) => s.clearAll);
// ...
const payload = (await response.json()) as DashboardPayload;
setDashboard(payload);
clearGameStore(); // Wipes fq-* keys + resets Zustand state so city page updates
```

---

## Bug 3 — Advisor message loaded with JSON double-quotes after refresh

**File:** `store/useGameStore.ts` (lines 126–129, 116)
**Severity:** Medium — visible UI corruption

### What was happening

`setAdvisorMessage` used the `persist()` helper which calls `JSON.stringify` on whatever value it receives:

```typescript
function persist(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// setAdvisorMessage calls:
persist("fq-advisor", msg);
// If msg = "Keep investing to grow your city!"
// localStorage stores: '"Keep investing to grow your city!"'  ← note the extra quotes
```

But `loadFromStorage` loaded the raw string without `JSON.parse`:

```typescript
const msgRaw = localStorage.getItem("fq-advisor");
// msgRaw = '"Keep investing to grow your city!"'  ← includes the JSON quotes
if (msgRaw) updates.advisorMessage = msgRaw;  // stores the quote-wrapped string
```

**Result:** After any page refresh, the advisor card displayed:
`"Keep investing to grow your city!"`
with visible double-quote characters at the start and end.

### Why it was a bug

All other string fields (`cityName`, `advisorMessage`) have the same pattern in `loadFromStorage` — they're read raw and not JSON-parsed. `setCityName` correctly uses `localStorage.setItem(key, value)` directly. `setAdvisorMessage` was the odd one out that used `persist()` (which JSON-stringifies) instead.

### Fix

Changed `setAdvisorMessage` to use `localStorage.setItem` directly, consistent with how `setCityName` works:

```typescript
// BEFORE
setAdvisorMessage: (msg) => {
  persist("fq-advisor", msg);  // persist() JSON.stringifies — wrong for plain strings
  set({ advisorMessage: msg });
},

// AFTER
setAdvisorMessage: (msg) => {
  if (typeof window !== "undefined") localStorage.setItem("fq-advisor", msg);
  set({ advisorMessage: msg });
},
```

---

## Bug 4 — Spending ratios truncated to 2 decimal places, causing score drift

**File:** `lib/financeEngine.ts` (lines 65–70)
**Severity:** Medium — incorrect health score and budget health calculations

### What was happening

`calculateSpendingRatios` rounded every ratio to exactly 2 decimal places:

```typescript
// BEFORE
return {
  needs_ratio:  Number((categoryTotals.needs  / totalSpent).toFixed(2)),
  wants_ratio:  Number((categoryTotals.wants  / totalSpent).toFixed(2)),
  treat_ratio:  Number((categoryTotals.treat  / totalSpent).toFixed(2)),
  invest_ratio: Number((categoryTotals.invest / totalSpent).toFixed(2)),
};
```

`toFixed(2)` rounds to 2 decimal places. The four rounded values often don't sum to exactly 1.0. For example, if spending is evenly split three ways:
- Each ratio is `0.3333...` → rounds to `0.33`
- Sum = `0.33 + 0.33 + 0.33 + 0.00 = 0.99` (not 1.0)

This cascaded into every score that uses the ratios:

- `calculateHealthScore` — could be up to 2 points off (needs × 0.5 or invest × 1.5 applied to truncated fractions)
- `calculateBudgetHealth` — variance from 50/30/20 ideal was measured on rounded ratios, not real ratios, producing a budget health score that was slightly wrong
- `calculateLiquidityScore` — invest and treat penalties/bonuses applied to truncated values

### Why it was a bug

The `.toFixed(2)` was likely added to make the ratios look cleaner for display, but it was applied at the calculation layer rather than only at the display layer. The correct place to round is in UI components like `formatPercent`, not in the math that feeds every score in the system.

### Fix

Removed the `.toFixed(2)` truncation to preserve full floating-point precision:

```typescript
// AFTER
return {
  needs_ratio:  categoryTotals.needs  / totalSpent,
  wants_ratio:  categoryTotals.wants  / totalSpent,
  treat_ratio:  categoryTotals.treat  / totalSpent,
  invest_ratio: categoryTotals.invest / totalSpent,
};
```

The ratios now always sum to exactly 1.0. Display rounding still happens in the UI components when percentages are shown.

---

## Bug 5 — Shared city proportions could decode to sum ≠ 1.0

**File:** `lib/cityShare.ts` (lines 43–48)
**Severity:** Low — wrong city metrics for shared cities

### What was happening

The share encoder multiplies each proportion by 1000 and rounds to store compact integers:

```typescript
// Encoding (correct concept but lossy)
Math.round(payload.props.needs * 1000)  // e.g. 0.3333 → 333
```

When four values are each rounded independently, their integers don't always sum to 1000. Example:
- `needs = 0.2501` → 250
- `wants = 0.2501` → 250
- `treats = 0.2501` → 250
- `investments = 0.2497` → 250
- Sum = 1000 ✓ (this case works)

But:
- `needs = 0.3333` → 333
- `wants = 0.3334` → 333
- `treats = 0.3333` → 333
- `investments = 0.0000` → 0
- Sum = 999 ✗ (off by 0.001)

The decoder then divided by 1000 naively:

```typescript
// BEFORE — no normalization
props: {
  needs:       raw.p[0] / 1000,  // 0.333
  wants:       raw.p[1] / 1000,  // 0.333
  treats:      raw.p[2] / 1000,  // 0.333
  investments: raw.p[3] / 1000,  // 0.000
},  // sum = 0.999, not 1.0
```

These 0.999-summing proportions were then fed into `calculateHealthScore()` and `generateCityState()`, which assume they sum to 1.0. The health score and all building counts would be slightly off — the shared city would look marginally different from the original.

### Why it was a bug

Lossy integer encoding always introduces rounding error. The decoder needs to account for this by normalising the values back to sum exactly 1.0 before passing them to any calculation.

### Fix

After decoding, divide each value by the actual decoded sum so they always total 1.0:

```typescript
// AFTER
const rawNeeds  = raw.p[0] / 1000;
const rawWants  = raw.p[1] / 1000;
const rawTreats = raw.p[2] / 1000;
const rawInvest = raw.p[3] / 1000;
const total = rawNeeds + rawWants + rawTreats + rawInvest || 1;
props: {
  needs:       rawNeeds  / total,
  wants:       rawWants  / total,
  treats:      rawTreats / total,
  investments: rawInvest / total,
},  // always sums to exactly 1.0
```

The `|| 1` guard handles the edge case where someone shares a city with all-zero proportions (e.g. no transactions), preventing a divide-by-zero.

---

## False Positives (investigated but not bugs)

### OpenAI API call style (`lib/aiInsights.ts`, `lib/aiLessons.ts`)

The code uses `client.responses.create()` with `input:` and reads `response.output_text`. This looks wrong if you're used to the older `client.chat.completions.create()` API, but it is **correct**. The project uses `openai` SDK v6.27.0 which includes the new OpenAI Responses API — the format designed specifically for the `gpt-4.1-mini` model family. The model name `gpt-4.1-mini` is also valid (released April 2025). No fix needed.

### `clearAll` not clearing `fq-income` and `fq-city-name`

`clearAll()` intentionally preserves `fq-income` and `fq-city-name`. If you reset your transaction history, you'd want to keep your city name and income setting — those are configuration, not data. By design.

### Group join returns success for duplicate membership

When a user joins a group they're already in, the upsert with `ignoreDuplicates: true` silently succeeds and returns the group. This is fine — the user is in the group, they get the group back. The alternative (returning a 409 Conflict) would be worse UX.
