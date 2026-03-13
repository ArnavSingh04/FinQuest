# FinQuest — Your Money Builds Your City

A gamified financial literacy app for teenagers (and anyone learning personal finance). Every purchase you log shapes a live 3D city: invest wisely and glass towers rise, overspend on impulses and storm clouds roll in.

---

## What the app does

FinQuest turns abstract money habits into a visible, reactive 3D city. There's no bank connection, no dollar amounts stored anywhere — only **spending proportions** across four categories:

| Category | What it represents | City effect |
|---|---|---|
| **Need** | Rent, groceries, bills | Apartment buildings grow with needs % |
| **Want** | Dining out, streaming, fun | Restaurants with lit signage (count scales with wants %) |
| **Treat** | Impulse buys, luxuries | Pollution/smog clouds (opacity scales with treats %) |
| **Invest** | Savings, shares, ETFs | Blue bank tower + emerald hex investment tower (height scales with invest %) |

The city reacts **instantly** — no page reload, no network request. Camera, lighting, rain, and building heights all smooth-interpolate (lerp) every animation frame.

---

## Pages

### `/` — Home
Landing page. Explains the concept, shows a mock city preview card, and links to Start Building.

### `/dashboard` — Log
- **Spending form** — enter merchant + amount + category. Tap "Simulate Payment" for a demo transaction.
- **Budget card** — set your monthly income; shows spent/remaining with a progress bar.
- **Health ring** — large score (0–100) with weather label.
- **Spending mix bars** — animated % bars for each category.
- **City snapshot** — weather, population, restaurant count.
- **AI Advisor** — personalised coaching message (via OpenAI or 5 cached fallbacks).
- **Recent transactions** — last 5 with link to full history.
- **Financial Report link** — shortcut to the /learn page.

### `/city` — 3D City
- **Fullscreen-expandable 3D canvas** — click ⛶ Expand for a fullscreen modal.
- **Camera presets** — Overview · Street Level · Top Down · Finance District.
- **Drag to orbit** · scroll/pinch to zoom.
- **Stats strip** — health score, weather emoji, population, restaurant count.
- **AI Advisor panel** — same advisor message visible here.
- **Building legend** — explains what each structure type means.
- **Spending form** — log transactions without leaving the city.

### `/history` — Transaction History
- All transactions sorted newest first with merchant, amount, date.
- Spending breakdown bars.
- City stats snapshot.
- Two-tap reset (requires confirmation tap).

### `/learn` — Financial Report
- **50/30/20 Rule tracker** — colour-coded pass/fail for Needs ≤ 50%, Wants ≤ 30%, Invest ≥ 20%.
- **Achievement badges** — City Founder, First Investment, Balanced Budget, Tycoon, etc.
- **Daily financial tip** — rotates hourly from a curated set of personal finance concepts.

---

## How the City Engine works

### Spending → Proportions
```
total = sum of all transaction amounts
needs  = (total Need  spend) / total
wants  = (total Want  spend) / total
treats = (total Treat spend) / total
invest = (total Invest spend) / total
```

### Proportions → Health Score (0–100)
```
healthScore =
  20 (baseline)
  + min(50, needs×100)  × 0.4   → up to 20 pts for needs coverage
  + min(40, invest×100) × 0.8   → up to 32 pts for investing
  - treats×100 × 0.5            → penalty for treats
  - budgetOverspend × 50        → penalty if monthly spend > income (capped at -25)
```

### Health Score → Weather
| Score | Weather | Visual effect |
|---|---|---|
| ≥ 88 | ✨ Thriving | Golden ambient, full stars, ember particles floating upward |
| ≥ 70 | ☀️ Clear | Bright directional light, stars visible |
| ≥ 50 | ⛅ Overcast | Muted ambient, pale fog |
| ≥ 30 | 🌧 Rain | Animated rain particle system, dark blue sky |
| ≥ 15 | ⛈ Storm | Heavy rain, random lightning flashes, near-black sky |
| < 15 | 💥 Destruction | Red ambient, orange ember rain, extreme darkness |

All weather transitions are smooth lerps — no sudden jumps.

### City buildings
- **Apartments** — count = `floor(needs% / 10)`, min 2, max 8. Each has window grid, rooftop water tower, entrance canopy.
- **Restaurants** — count = `floor(wants% / 8)`, min 1, max 6. Each has lit sign board, awning, shop window.
- **Bank Tower** — height = `1 + (invest% / 30) × 7`. Has podium columns, window grid, crown spire with beacon light.
- **Investment Tower** — height = `0.5 + (invest% / 20) × 4`. Hexagonal shaft with vertical glowing strips, glowing cone tip.
- **Pollution clouds** — count = `floor(treats × 14)`, animated floating, opacity driven by treats fraction.

All height changes lerp over ~0.4 seconds using `useRef<THREE.Mesh>` + `useFrame`.

### 50/30/20 Rule
A classic personal finance budgeting framework:
- **50% Needs** — essential living costs should not exceed half your income
- **30% Wants** — discretionary lifestyle spending (including treats)
- **20% Invest** — savings rate that builds long-term wealth

The `/learn` page shows whether your actual proportions meet each target, with an explanatory tip if you miss a band.

---

## Running locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # Production build
```

### Optional environment variables (`.env.local`)

```
OPENAI_API_KEY=sk-...             # Live AI advisor messages (gpt-4o-mini)
NEXT_PUBLIC_SUPABASE_URL=...      # Cross-device persistence (not required)
NEXT_PUBLIC_SUPABASE_ANON_KEY=... # Cross-device persistence (not required)
```

Without `OPENAI_API_KEY` the advisor rotates through 5 pre-written coaching messages. Without Supabase, everything lives in `localStorage` — all data stays private in the user's browser.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| 3D | Three.js · React Three Fiber · Drei |
| State | Zustand with localStorage persistence |
| Styling | Tailwind CSS v4 + glass morphism design tokens |
| AI | OpenAI SDK (`gpt-4o-mini`) with fallback responses |
| Persistence | Browser localStorage · Supabase (optional) |

---

## Key source files

| File | Role |
|---|---|
| `lib/financeEngine.ts` | Pure function: `transactions[]` → `Proportions` |
| `lib/cityEngine.ts` | Pure function: `Proportions` → `CityState` (health, weather, building sizes) |
| `lib/aiInsights.ts` | OpenAI API call with 5 fallback responses |
| `store/useGameStore.ts` | Single Zustand store; orchestrates all recalculations on each transaction |
| `components/city/CityGenerator.tsx` | All Three.js building components with useFrame lerp animations |
| `components/city/CityScene.tsx` | R3F Canvas wrapper + fullscreen expand button |
| `components/city/CityFullscreen.tsx` | Fullscreen modal + camera presets + shared scene internals |
| `components/budget/BudgetCard.tsx` | Monthly income input + spend-vs-budget progress bar |
| `components/literacy/FinancialReport.tsx` | 50/30/20 tracker, achievement badges, daily tip |
| `app/api/insight/route.ts` | `POST /api/insight` — accepts Proportions, returns `{ insight: string }` |

---

## Financial concepts covered in the app

- **Needs vs Wants vs Treats vs Investments** — foundational spending categorisation
- **50/30/20 Rule** — budgeting framework (Elizabeth Warren)
- **Compound interest** — illustrated via investment tower growth over time
- **Budget utilisation** — overspending directly penalises your city health score
- **Emergency fund** — covered in the tips carousel
- **Lifestyle creep** — covered in the tips carousel
- **Pay yourself first** — covered in the tips carousel
- **Impulse buying** — the 48-hour rule tip
