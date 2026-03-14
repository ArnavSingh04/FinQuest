# FinQuest — Complete Codebase Guide

> A financial literacy game for teenagers where every spending decision shapes a living 3D city.

---

## Table of Contents

1. [What Is FinQuest?](#what-is-finquest)
2. [Tech Stack](#tech-stack)
3. [Directory Structure](#directory-structure)
4. [Core Game Loop](#core-game-loop)
5. [Data Types](#data-types)
6. [Pages & Routes](#pages--routes)
7. [API Routes](#api-routes)
8. [State Management](#state-management)
9. [Business Logic (lib/)](#business-logic-lib)
10. [3D City (Three.js)](#3d-city-threejs)
11. [Authentication](#authentication)
12. [Database Schema](#database-schema)
13. [Data Flow Diagrams](#data-flow-diagrams)
14. [Key Design Decisions](#key-design-decisions)

---

## What Is FinQuest?

FinQuest teaches teenagers healthy money habits through a **living 3D city metaphor**. You log your real spending → the app categorises it → a health score is computed → your personal city reflects those habits in 3D.

- Spend wisely → tall bank towers, lots of apartments, thriving weather
- Overspend on treats → smog clouds, crumbling buildings, storm weather
- Invest consistently → unlock hospitals, schools, parks

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript 5 |
| UI | React 19 + Tailwind CSS 4 |
| 3D | Three.js 0.183 + React Three Fiber 9 + Drei 10 |
| State | Zustand 5 |
| Backend / DB | Supabase (PostgreSQL + Auth + RLS) |
| AI | OpenAI API (`gpt-4.1-mini`) |
| Animation | Framer Motion 12 |

---

## Directory Structure

```
FinQuest/
├── app/                        Next.js App Router pages + API routes
│   ├── api/                    All backend endpoints
│   │   ├── transaction/        POST / GET / DELETE transactions
│   │   ├── pay/                Quick-log endpoint (no manual amount)
│   │   ├── insight/            AI advisor message
│   │   ├── lessons/            CRUD + generation for lessons
│   │   └── groups/             Create / join / list / member profile
│   ├── city/                   City view + shared city viewer
│   ├── dashboard/              Full financial dashboard
│   ├── history/                Transaction history + reset
│   ├── lessons/                Lesson hub + individual lesson pages
│   ├── groups/                 Group social feature
│   ├── pay/                    Quick-log UI
│   ├── login/ signup/          Auth pages
│   ├── layout.tsx              Root layout (fonts, global styles)
│   └── page.tsx                Public landing page
│
├── components/
│   ├── city/                   All 3D city React components
│   │   ├── CityGenerator.tsx   Procedural building placement (Three.js)
│   │   ├── CityFullscreen.tsx  Fullscreen viewer + camera presets + lighting
│   │   └── CityScene.tsx       Inline canvas wrapper (card/fullscreen toggle)
│   ├── spending/
│   │   └── SpendingForm.tsx    Main transaction input form
│   ├── dashboard/              Dashboard sub-components (charts, cards)
│   ├── layout/                 Page wrappers, nav
│   ├── sheets/                 Bottom sheet content panels
│   └── ui/                     Generic reusable UI atoms
│
├── lib/
│   ├── financeEngine.ts        Spending ratio + financial score calculations
│   ├── cityEngine.ts           City state + health score generation
│   ├── cityLevel.ts            City tier names + streak utility
│   ├── cityShare.ts            Encode / decode city share URLs
│   ├── gamification.ts         XP + achievement system
│   ├── aiInsights.ts           OpenAI advisor message generation
│   ├── aiLessons.ts            OpenAI lesson generation
│   ├── lessonTriggers.ts       Rules that decide which lesson to show
│   ├── playerState.ts          Dashboard payload builder
│   ├── auth.ts                 Browser Supabase client + auth helpers
│   ├── auth-server.ts          Server + admin Supabase clients
│   └── server/
│       ├── lessonService.ts    Server-side lesson CRUD + dedup logic
│       └── transactionService.ts  Transaction CRUD
│
├── store/
│   ├── useGameStore.ts         Main Zustand store (city state, transactions)
│   ├── useUIStore.ts           Sheet / modal state
│   └── useQuestsStore.ts       Quests + lessons UI state
│
├── types/index.ts              All shared TypeScript types
├── hooks/useAuth.ts            Auth state React hook
├── contexts/CityStateContext.tsx  Context for overriding city in share viewer
└── supabase/                   Schema migrations / definitions
```

---

## Core Game Loop

```
User logs a transaction (amount + category)
          │
          ▼
POST /api/transaction
          │
          ▼
Calculate spending ratios
  needs% / wants% / treats% / invest%
          │
          ▼
Calculate financial scores
  liquidity / budgetHealth / investmentGrowth / stability / economyScore
          │
          ▼
Generate city state
  apartment count ← needs%
  restaurant count ← wants%
  bank tower height ← invest%
  hex tower height ← invest%
  weather ← health score
  population ← health score / 10
          │
          ▼
3D city re-renders to reflect new state
          │
          ▼
AI advisor generates personalised message
          │
          ▼
Lesson triggered if spending pattern matches a rule
```

---

## Data Types

> All types live in `types/index.ts`

### Transactions

```typescript
type TransactionCategory = "Need" | "Want" | "Treat" | "Invest"

interface Transaction {
  id?: string
  user_id?: string
  amount: number
  category: TransactionCategory
  merchant_name?: string | null
  note?: string | null
  source?: string           // "manual" | "pay" (quick log)
  spent_at?: string
  created_at?: string
}
```

### Spending & Finance

```typescript
interface Proportions {
  needs: number             // 0–1, fraction of total spend
  wants: number
  treats: number
  investments: number
}

interface FinancialScores {
  liquidity: number         // 0–100 — how safe is cash flow
  budgetHealth: number      // 0–100 — how close to 50/30/20 rule
  investmentGrowth: number  // 0–100 — investment habit strength
  stability: number         // 0–100 — composite safety score
  economyScore: number      // 0–100 — overall economy
  totalSpent: number
  transactionCount: number
}
```

### City State

```typescript
interface CityState {
  bankHeight: number        // Scales bank tower mesh (invest%)
  restaurantCount: number   // Number of restaurant buildings
  apartmentCount: number    // Number of apartment buildings
  towerHeight: number       // Scales hex investment tower
  weather: WeatherType      // Visual theme of city
  population: number        // healthScore / 10
  healthScore: number       // 0–100 master score
  budgetUsed: number        // totalSpend / monthlyIncome
}

type WeatherType =
  | "thriving"    // score ≥ 88  — brilliant night city
  | "clear"       // score ≥ 70  — vibrant and bright
  | "overcast"    // score ≥ 50  — dim but active
  | "rain"        // score ≥ 30  — dark and rainy
  | "storm"       // score ≥ 15  — stormy
  | "destruction" // score < 15  — apocalyptic red glow
```

### City Tiers

```typescript
// lib/cityLevel.ts
const CITY_TIERS = [
  { name: "Shanty Town", icon: "🏚️", minScore: 0,  color: "text-red-400"     },
  { name: "Village",     icon: "🏘️", minScore: 20, color: "text-orange-400"  },
  { name: "Town",        icon: "🏙️", minScore: 40, color: "text-amber-400"   },
  { name: "City",        icon: "🌆", minScore: 55, color: "text-sky-400"     },
  { name: "Metropolis",  icon: "🌇", minScore: 70, color: "text-violet-400"  },
  { name: "Utopia",      icon: "✨", minScore: 88, color: "text-emerald-400" },
]
```

### Lessons & Progress

```typescript
interface Lesson {
  id: string
  triggerId: string         // which rule triggered this lesson
  title: string
  concept: string
  previewText: string
  explanation: string
  examples: string[]        // pulled from user's own transactions
  advice: string[]
  completed: boolean
  generatedBy: string       // "openai" | "fallback"
  createdAt: string
}

interface UserProgress {
  xp: number
  level: number             // Math.floor(xp / 120) + 1
  nextLevelXp: number       // level × 120
  achievements: AchievementState[]
}
```

### Groups & Social

```typescript
interface GroupSummary {
  id: string
  name: string
  invite_code: string
  owner_id: string
  memberCount: number
  members: GroupMemberSummary[]
  leaderboard: GroupLeaderboardEntry[]  // sorted by XP
}
```

---

## Pages & Routes

### Public

| Route | Purpose |
|---|---|
| `/` | Landing page — hero, feature overview, CTA to sign up |
| `/login` | Email + password login |
| `/signup` | Email + password + username + full name registration |

### Authenticated — Core

#### `/city`
The main player hub. Left column: 3D city canvas + stats strip (health, weather, population, restaurants). Right column: SpendingForm + city legend.

- Tap **Expand** → fullscreen city with camera presets
- Tap **Share** → encodes city state to a URL, copies to clipboard
- After logging a transaction → advisor message loads asynchronously from `/api/insight`

#### `/city/view?c=<code>`
Shared city viewer. Decodes the URL `c=` param → renders someone else's city.
Shows side-by-side spending ratio comparison with your own city plus a verdict ("your city is healthier / neck and neck / they're doing better").

#### `/dashboard`
Full financial dashboard. Charts, spending cards, transaction list, all scores.

#### `/history`
Timeline of every logged transaction. Shows spending breakdown bars (Needs / Wants / Treat / Invest). Includes a **Reset** button that deletes all transactions.

### Authenticated — Lessons

#### `/lessons`
Lesson hub. Lists all generated lessons. Includes **Generate New Lesson** button.

#### `/lessons/[lessonId]`
Full lesson view: concept, explanation, examples from your own spending, actionable advice list. Mark as Complete button.

### Authenticated — Groups

#### `/groups`
Create a group (gives you an invite code) or join one by entering a code. Lists groups you're in, with member list and live leaderboard sorted by XP.

#### `/groups/[groupId]/members/[memberId]`
View a group member's full profile: their city, spending ratios, achievements, XP progress, and AI insights. Only visible to group members.

### Utility

| Route | Purpose |
|---|---|
| `/pay` | Quick-log: pick an amount bucket + category in 2 taps |
| `/learn` | Redirects to `/lessons` |
| `/insights` | Redirects to `/` |

---

## API Routes

All routes require authentication unless noted. Auth is via Supabase session cookie.

### Transactions

#### `POST /api/transaction`
Log a new transaction. Returns full recalculated dashboard state.

```
Request  { amount, category, merchant_name?, note?, source? }
Response DashboardPayload
```

Steps:
1. Validate `amount > 0`, `category` in allowed list
2. Insert into `transactions` table
3. Fetch all user transactions
4. Recalculate ratios → scores → city metrics → gamification
5. Return `DashboardPayload`

#### `GET /api/transaction`
Get current dashboard state (recalculated from all transactions).

#### `DELETE /api/transaction`
Delete **all** user transactions. Returns empty dashboard state.

### Quick Log

#### `POST /api/pay`
Same as POST /api/transaction but takes an `amountBucket` instead of exact amount.

```
Request  { amountBucket: "under-10"|"10-20"|"20-50"|"50-100"|"100-200"|"over-200", category }
```

Buckets map to midpoints: $5, $15, $35, $75, $150, $250.

### AI Advisor

#### `POST /api/insight`
Generate an AI advisor message for the current state.

```
Request  UserMetrics (ratios, scores, cityMetrics)
Response { insight: string, lesson: TriggeredLesson }
```

Calls OpenAI with the user's metrics → returns a personalised 1–2 sentence coaching message. Falls back to hardcoded message if no API key.

### Lessons

#### `POST /api/lessons/generate`
Generate a new personalised lesson. Evaluates which lesson trigger is most relevant, then calls OpenAI to write a lesson using your actual transaction examples.

#### `GET /api/lessons`
Returns all your lessons (auto-generates 5 if you have none).

#### `GET /api/lessons/[lessonId]`
Single lesson detail.

#### `PATCH /api/lessons/[lessonId]`
Mark a lesson complete/incomplete. Body: `{ completed: boolean }`.

### Groups

#### `POST /api/groups/create`
Create a group. Generates a random 8-character invite code.

#### `POST /api/groups/join`
Join a group by invite code.

#### `GET /api/groups/list`
All groups you're in, with member lists and leaderboards.

#### `GET /api/groups/[groupId]/members/[memberId]`
A group member's full profile (only accessible to other group members).

---

## State Management

### useGameStore (`store/useGameStore.ts`)
The single source of truth for all game data. Persisted to `localStorage`.

**State shape:**
```typescript
{
  transactions: Transaction[]
  proportions: Proportions           // current spending split
  cityState: CityState               // drives the 3D scene
  advisorMessage: string             // latest AI tip
  isAdvisorLoading: boolean
  monthlyIncome: number              // used for budget penalty calc
  cityName: string                   // user's city nickname
  rewardBuildings: RewardBuilding[]  // buildings unlocked via quests
  lastAffectedCategory: TransactionCategory | null
  resetCameraTrigger: number         // incremented to reset 3D camera
}
```

**Key actions:**
```typescript
addTransaction(t)         // adds transaction + recalculates city state
clearAll()                // wipes everything
loadFromStorage()         // hydrates from localStorage on app start
setAdvisorMessage(msg)    // updates the AI tip card
setMonthlyIncome(n)       // recalculates budget penalty
setResetCameraTrigger()   // increments to tell canvas to reset camera
```

**localStorage keys:**
```
fq-transactions
fq-proportions
fq-city-state
fq-advisor
fq-income
fq-city-name
fq-reward-buildings
```

### useUIStore (`store/useUIStore.ts`)
Controls which bottom sheet or modal is open.

```typescript
{
  activeSheet: "stats"|"history"|"group"|"learn"|"quests"|"log" | null
  cityPulseTrigger: number
}
```

### useQuestsStore (`store/useQuestsStore.ts`)
Tracks quest progress and mock lessons for the quests UI.

---

## Business Logic (lib/)

### `lib/financeEngine.ts` — Spending → Scores

**`calculateSpendingRatios(transactions)`**
Groups spending by category, divides by total. Returns fractions 0–1.

**`calculateLiquidityScore(transactions, ratios?)`** → 0–100
```
60 + invest×25 + needs×20 − treats×35 − wants×10
```
High investment and needs → more liquid. Treats destroy liquidity.

**`calculateBudgetHealth(transactions, ratios?)`** → 0–100
Variance from the ideal 50/30/20 rule (50% needs, 30% wants+treats, 20% invest).

**`calculateInvestmentGrowth(transactions, ratios?)`** → 0–100
```
invest_ratio × 75 + consistency_bonus (invest transaction count × 8, capped at 25)
```

**`calculateFinancialScores(transactions, ratios?)`** → FinancialScores
Runs all four calculations and returns the composite.

---

### `lib/cityEngine.ts` — Scores → City

**`calculateHealthScore(proportions, budgetUsed?)`** → 0–100

| Component | Formula | Max |
|---|---|---|
| Baseline | constant | 20 |
| Needs score | `min(50, needs%) × 0.5` | 25 |
| Invest score | `min(40, invest%) × 1.5` | 60 |
| Treat penalty | `treats% × 0.6` | −∞ |
| Budget penalty | `(budgetUsed − 1) × 50`, capped | −25 |

So the theoretical max is 105 → clamped to 100.
The 50/30/20 rule (50% needs, 30% wants, 20% invest) gives ~75.

**`mapHealthToWeather(score)`**
```
≥ 88 → thriving
≥ 70 → clear
≥ 50 → overcast
≥ 30 → rain
≥ 15 → storm
 < 15 → destruction
```

**Building scale mappings:**
```typescript
mapNeedsToApartments(pct)  → max(8, round(pct/100 × 24))
mapWantsToRestaurants(pct) → max(4, round(pct/100 × 12))
mapInvestToBank(pct)       → 1 + (pct/30) × 7
mapInvestToTower(pct)      → 0.5 + (pct/20) × 4
```

---

### `lib/lessonTriggers.ts` — When to Teach

6 triggers fire lessons based on your current metrics:

| Trigger | Condition | Priority | Dedup window |
|---|---|---|---|
| High Treats | treat_ratio ≥ 22% | 100 | 7 days |
| Low Liquidity | liquidity < 45 | 92 | 10 days |
| Budget Imbalance | budgetHealth < 55 | 85 | 7 days |
| Low Investment | invest_ratio < 10% | 78 | 10 days |
| Strong Investment | investmentGrowth ≥ 65 | 52 | 14 days |
| Balanced Behavior | budgetHealth ≥ 72 AND stability ≥ 65 | 40 | 14 days |

---

### `lib/gamification.ts` — Achievements & XP

7 achievements:

| Achievement | Condition | XP |
|---|---|---|
| City Founder | 1+ transactions | 20 |
| First Investment | any Invest transaction | 100 |
| Disciplined Saver | invest_ratio ≥ 20% | 70 |
| Balanced Budget | meets 50/30/20 rule | 90 |
| City Thriving | economyScore ≥ 88 OR growth ≥ 80 | 120 |
| Clean Streak | treats_ratio < 5% | 80 |
| Tycoon | invest_ratio ≥ 35% | 80 |

**Level formula:** `level = floor(totalXP / 120) + 1`

Level 2 at 120 XP, level 3 at 240 XP, etc.

---

### `lib/cityShare.ts` — Share URLs

`encodeCityShare({ name, props, city })` → base64 string
- Packs proportions (×1000 for precision), city state (7 values), and city name
- URL-safe: replaces `+`, `/`, `=` with `-`, `_`, empty string
- Does NOT encode `budgetUsed` (privacy — doesn't expose raw spending amounts)

`decodeCityShare(code)` → `SharedCityPayload | null`

---

## 3D City (Three.js)

### Architecture

The city is rendered by three files that work together:

| File | Role |
|---|---|
| `CityScene.tsx` | Canvas wrapper, embedded/fullscreen toggle |
| `CityFullscreen.tsx` | Lighting, fog, sky, camera system, HUD |
| `CityGenerator.tsx` | All buildings, roads, trees, traffic, weather FX |

### Lighting System (`CityFullscreen.tsx`)

6 weather configs control all scene lighting:

```typescript
const WEATHER_CFG = {
  thriving:    { ambient: 1.4,  dir: 3.5,  /* brilliant night */ },
  clear:       { ambient: 1.1,  dir: 2.8,  /* vibrant & bright */ },
  overcast:    { ambient: 0.72, dir: 1.4,  /* dim but active  */ },
  rain:        { ambient: 0.38, dir: 0.5,  /* dark and rainy  */ },
  storm:       { ambient: 0.2,  dir: 0.22, /* stormy          */ },
  destruction: { ambient: 0.12, dir: 0.15, /* apocalyptic red */ },
}
```

All transitions are smooth — values lerp in `useFrame` at 1.2–1.4 speed. The fog colour, sky background, and hemisphere light all lerp simultaneously so the weather change feels like a gradual shift.

### Camera Presets

```
Overview    [12, 12, 16]  — isometric classic view
Street      [0, 1.6, 7]   — eye-level pedestrian view
Top Down    [-1, 28, 0.1] — map/satellite view
Finance     [6, 5, 4]     — financial district close-up
West Side   [-14, 6, 2]   — residential neighbourhood
```

Camera interpolates smoothly (`lerp at dt × 2.5`) when a preset is selected. Free orbit (mouse drag) disengages preset mode.

### Building System (`CityGenerator.tsx`)

**How it works:** A module-level `CITY_SLOTS` array is computed once at load time. It assigns building types to 65 grid positions using a seeded hash + zone-based probability weights. This means the city layout is deterministic (always the same) but mixed (apartments next to offices, restaurants near banks — like a real city).

**Zone probabilities:**

| Zone | apt | condo | rest | office | market |
|---|---|---|---|---|---|
| Financial core (near bank) | low | low | med | high | low |
| South commercial | low | very low | high | low | high |
| NW residential | high | med | low | very low | very low |
| Industrial east (x > 7) | low | none | low | high | none |
| Mixed default | med | low | med | low | low |

**Building types and what drives them:**

| Building | Driven by | Visible when |
|---|---|---|
| Apartments | `needs%` | `idx < apartmentCount` (up to 24) |
| Condo Towers | `needs%` | `idx < floor(apartmentCount / 3)` |
| Restaurants | `wants%` | `idx < restaurantCount` (up to 12) |
| Office Blocks | `invest%` | `idx < round(invest × 8)` |
| Markets | Static | Always visible |
| Bank Tower | `invest%` | Always, height scales |
| Hex Tower | `invest%` | Always, height scales |
| School | `needs%` | needs ≥ 40% |
| Hospital | `invest%` | invest ≥ 15% |
| Shopping Mall | `wants%` | wants ≥ 15% |
| Warehouses | Static | Always |
| Pollution Clouds | `treats%` | Count = `floor(treats × 18)` |
| Cars | `population` | Count = 2–8 |
| Pedestrians | `population` | Count = 3–16 |

**Smooth transitions:** All buildings use a `useLerpScale(target)` hook that animates `scale.y` toward target in `useFrame`. Target is 1 when visible, 0.01 when invisible. All details (windows, canopies, signs) are guarded with `{visible && ...}` to prevent floating elements.

**Hover tooltips:** Hovering any building opens an HTML overlay showing: building name, relevant stat (e.g. "Investments: 22%"), a state label (e.g. "Strong"), and a 1-sentence tip to improve.

---

## Authentication

### Sign Up / Login Flow

```
app/signup → lib/auth.ts → signUpWithEmail()
                              → supabase.auth.signUp()
                                 stores { username, full_name } in user_metadata
                              → returns { user, session } or error

app/login  → lib/auth.ts → signInWithEmail()
                              → supabase.auth.signInWithPassword()
                              → cookie set by Supabase SSR helper
```

### Server-Side Auth

Every API route calls:
```typescript
const supabase = await createSupabaseServerClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })
```

The admin client (`createSupabaseAdminClient()`) is only used for operations that need to bypass Row Level Security (e.g. looking up a group by invite code, which needs to be publicly queryable).

### Session Storage
Sessions are stored in httpOnly cookies by Supabase's SSR helpers. The browser client refreshes them automatically. The `useAuth()` hook (`hooks/useAuth.ts`) exposes `{ user, loading }` to client components.

---

## Database Schema

Tables inferred from API routes and Supabase queries:

```sql
-- User profiles (mirrors auth.users metadata)
create table profiles (
  id         uuid primary key references auth.users,
  username   text unique,
  full_name  text,
  created_at timestamptz default now()
);

-- Every spending transaction
create table transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  amount        numeric not null,
  category      text not null check (category in ('Need','Want','Treat','Invest')),
  merchant_name text,
  note          text,
  source        text default 'manual',
  spent_at      timestamptz,
  created_at    timestamptz default now()
);

-- AI-generated lessons
create table lessons (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  trigger_id   text not null,
  title        text,
  concept      text,
  preview_text text,
  explanation  text,
  examples     jsonb,
  advice       jsonb,
  completed    boolean default false,
  generated_by text default 'openai',
  created_at   timestamptz default now()
);

-- AI insight history
create table ai_insights (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  lesson_id    uuid references lessons(id),
  insight_text text not null,
  lesson_text  text,
  model        text default 'gpt-4.1-mini',
  created_at   timestamptz default now()
);

-- City metric snapshots (historical trend)
create table city_snapshots (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users on delete cascade,
  health_score     int,
  weather          text,
  population       int,
  restaurant_count int,
  apartment_count  int,
  growth           int,
  created_at       timestamptz default now()
);

-- Spending ratio snapshots (historical trend)
create table spending_snapshots (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  needs_ratio  numeric,
  wants_ratio  numeric,
  treat_ratio  numeric,
  invest_ratio numeric,
  created_at   timestamptz default now()
);

-- XP + level tracking
create table user_progress (
  user_id    uuid primary key references auth.users on delete cascade,
  total_xp   int default 0,
  level      int default 1,
  updated_at timestamptz default now()
);

-- Social groups
create table groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  invite_code text unique not null,
  owner_id    uuid not null references auth.users on delete cascade,
  created_at  timestamptz default now()
);

-- Group membership
create table group_members (
  group_id  uuid not null references groups on delete cascade,
  user_id   uuid not null references auth.users on delete cascade,
  role      text default 'member' check (role in ('owner','member')),
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);
```

All user-owned tables have Row Level Security enabled. Users can only read/write their own rows.

---

## Data Flow Diagrams

### Logging a Transaction

```
SpendingForm.tsx
    ↓  POST /api/transaction
    ↓  { amount, category, merchant_name?, note? }
    ↓
transactionService.createTransaction()
    ├─ INSERT INTO transactions
    ├─ SELECT all transactions WHERE user_id = me
    ├─ calculateSpendingRatios()
    ├─ calculateFinancialScores()
    ├─ generateCityState()
    ├─ calculateGamification()
    └─ return DashboardPayload

SpendingForm receives DashboardPayload
    ├─ Save proportions/cityState/metrics to localStorage
    ├─ useGameStore.addTransaction() → Zustand updates
    └─ call onSubmitted() → triggers advisor load

CityGenerator re-renders
    └─ new apartment count / restaurant count / bank height / weather
```

### Generating a Lesson

```
User clicks "Generate New Lesson"
    ↓  POST /api/lessons/generate
    ↓
lessonService.generateLessonForUser()
    ├─ fetch all user transactions
    ├─ calculateFinancialScores()
    ├─ getTriggeredLessonTriggers() → pick highest-priority applicable trigger
    ├─ check if lesson for this trigger was generated within dedup window
    ├─ if not: aiLessons.generatePersonalizedLesson()
    │     └─ OpenAI prompt includes trigger name + user's actual transaction examples
    ├─ INSERT INTO lessons
    └─ return lesson

UI shows "Your new lesson is ready"
User clicks → /lessons/[lessonId] → full lesson view
```

### Shared City View

```
User taps Share on /city
    └─ cityShare.encodeCityShare({ name, proportions, cityState })
          ↓  compresses to URL-safe base64
    └─ copies https://finquest.app/city/view?c=<code> to clipboard

Recipient opens URL
    ↓  /city/view/page.tsx
    ↓  decodeCityShare(code) → SharedCityPayload
    ↓
Left: CityCanvas with CityStateContext.Provider
    └─ overrides Zustand with the decoded city state
    └─ renders sender's city exactly as they had it

Right: Comparison card
    └─ your proportions (from store) vs theirs (from URL)
    └─ verdict: "your city is healthier" etc.
```

### Group Leaderboard Build

```
GET /api/groups/list
    ↓
For each group the user is in:
    ├─ adminClient: select group_members join profiles
    ├─ adminClient: select user_progress for all members
    ├─ adminClient: select latest city_snapshots.growth per member
    └─ sort members by total_xp descending
    ↓
Return { groups: GroupSummary[] }
```

---

## Key Design Decisions

### 1. City is fully derived — no city_state table
There is no "city state" table in the database. Every time the app loads, it fetches all transactions and recalculates everything from scratch. This means the city is always consistent with the real transaction data and there's no sync issue.

### 2. Health score rewards investment heavily
The invest coefficient (×1.5) is 3× the needs coefficient (×0.5). This is intentional — investment is the hardest habit to build and the most impactful long-term. The max score (100) requires ≥40% investment spending, which is aspirational for most users.

### 3. Lesson dedup prevents spam
The same lesson trigger can't fire again within its window (7–14 days). This forces variety — you won't keep seeing "impulse spending" if you already saw it this week — and mimics how real learning is spaced.

### 4. OpenAI fallback mode means no API key needed to run locally
If `OPENAI_API_KEY` is missing, `aiInsights.ts` and `aiLessons.ts` both fall through to hardcoded templates. The app is fully playable without AI.

### 5. LocalStorage is the primary offline persistence
Zustand's store is backed by localStorage (`fq-*` keys). The Supabase DB is the source of truth for multi-device/group features, but the city page works entirely offline (or without a network call) once the store is hydrated.

### 6. Share URLs are privacy-safe
`cityShare.ts` never encodes `budgetUsed` (which would reveal how much you've spent relative to income). It only encodes the ratios (0–1 fractions) and the derived city state. You can share your city without revealing your absolute spending.

### 7. 3D city is purely visual / no interaction with DB
The Three.js scene reads only from Zustand (`useGameStore`). It never makes API calls. This keeps the 3D layer fast and makes it trivial to preview any city state (used in the What-If simulator and share viewer via `CityStateContext`).

### 8. What-If Simulator
The What-If Simulator (accessible from the dashboard) lets users drag spending sliders and see the city update in real-time. It works by wrapping `CityCanvas` in a `CityStateContext.Provider` with overridden values — the main store is untouched.

---

## Quick Reference: File → Feature

| You want to change… | Edit this file |
|---|---|
| Health score formula | `lib/cityEngine.ts` → `calculateHealthScore()` |
| What buildings appear when | `components/city/CityGenerator.tsx` — each component's `visible` condition |
| City layout / positions | `CityGenerator.tsx` → `_buildCitySlots()` → `POS` array |
| Lighting / weather colours | `components/city/CityFullscreen.tsx` → `WEATHER_CFG` |
| City tier names / thresholds | `lib/cityLevel.ts` → `CITY_TIERS` |
| Achievement conditions / XP | `lib/gamification.ts` |
| Lesson trigger rules | `lib/lessonTriggers.ts` |
| Financial score formulas | `lib/financeEngine.ts` |
| Transaction API behaviour | `app/api/transaction/route.ts` |
| Advisor AI prompt | `lib/aiInsights.ts` |
| Lesson AI prompt | `lib/aiLessons.ts` |
| Zustand store shape/actions | `store/useGameStore.ts` |
| All TypeScript types | `types/index.ts` |
| Auth helpers | `lib/auth.ts` (browser) / `lib/auth-server.ts` (server) |
