# FinQuest

FinQuest is a mobile-first hackathon MVP that teaches financial literacy by
turning spending habits into a living 3D city.

Core loop:

`User logs spending -> transaction saved -> spending ratios calculated -> city metrics generated -> 3D city reacts -> AI insight generated`

## Tech Stack

- Next.js with App Router
- React + TypeScript
- Tailwind CSS
- Zustand for client state
- Three.js with React Three Fiber and Drei
- Supabase for data storage
- OpenAI API for financial coaching text

## What's Already Done

The current codebase includes the initial scaffold and an end-to-end MVP flow:

- Home page with `Start Tracking` and `View My City` entry points
- Mobile-first spending form with:
  - amount input
  - category selection for `Need`, `Want`, `Treat`, `Invest`
  - submit action to `POST /api/transaction`
- Dashboard page showing:
  - spending ratios
  - derived city metrics
  - AI insight card
- 3D city page showing:
  - React Three Fiber canvas
  - ground plane
  - lighting
  - generated buildings and smoke elements based on city metrics
- API route for transaction processing
- API route for AI insight generation
- Shared finance and city logic in reusable `lib` modules
- Zustand store for real-time city updates across screens
- Tailwind-based fintech-style UI shell
- PWA manifest stub
- Working `npm run dev` and `npm run build`

## Project Structure

```text
app/
  api/
    insight/route.ts
    transaction/route.ts
  city/page.tsx
  dashboard/page.tsx
  globals.css
  layout.tsx
  page.tsx

components/
  city/
    CityGenerator.tsx
    CityScene.tsx
  dashboard/
    StatsCard.tsx
  spending/
    SpendingForm.tsx
  ui/

lib/
  aiInsights.ts
  cityEngine.ts
  financeEngine.ts
  supabase.ts

store/
  useCityStore.ts

styles/
  tokens.css

types/
  index.ts
```

## Module Overview

### `app/page.tsx`

Landing page for the MVP. It introduces FinQuest and links users into the
dashboard or city view.

### `components/spending/SpendingForm.tsx`

Primary user input component.

Responsibilities:

- collect amount + category
- send transactions to `/api/transaction`
- update the Zustand city store
- persist ratios and metrics locally for a smoother demo flow

### `app/api/transaction/route.ts`

Main backend flow for spending submission.

Current behavior:

1. Validate request body
2. Insert transaction into Supabase if env vars are configured
3. Fetch all transactions
4. Calculate category ratios
5. Generate city metrics
6. Return `{ ratios, cityMetrics, transactions, mode }`

If Supabase environment variables are missing, the route falls back to a local
preview mode so the UI can still be demoed.

### `lib/financeEngine.ts`

Contains `calculateSpendingRatios(transactions)`.

It converts all transactions into:

- `needs_ratio`
- `wants_ratio`
- `treat_ratio`
- `invest_ratio`

### `lib/cityEngine.ts`

Contains `generateCityMetrics(ratios)`.

Current mapping:

- `needs_ratio -> housing`
- `wants_ratio -> entertainment`
- `treat_ratio -> pollution`
- `invest_ratio -> growth`

### `store/useCityStore.ts`

Global client store for:

- `cityMetrics`
- `setCityMetrics()`

This lets the 3D city react immediately after a spending event.

### `components/city/CityScene.tsx`

Sets up the 3D environment using React Three Fiber.

Includes:

- camera
- lighting
- ground plane
- `CityGenerator`

### `components/city/CityGenerator.tsx`

Transforms metrics into simple visual geometry for fast iteration.

Current rendering rules:

- `housing` -> small blue houses
- `growth` -> green skyscrapers
- `entertainment` -> colorful buildings
- `pollution` -> smoke-like spheres

### `app/dashboard/page.tsx`

Combines the input form, spending stats, city metrics, and AI advice into a
single mobile-friendly dashboard.

### `app/api/insight/route.ts`

Accepts spending ratios and returns a short plain-language explanation of the
user's money habits.

Uses:

- OpenAI when `OPENAI_API_KEY` is configured
- a fallback local insight generator when it is not

### `lib/supabase.ts`

Creates the Supabase client and includes an example SQL schema string for the
`transactions` table.

## Data Flow

The current MVP flow works like this:

1. User logs a transaction in `SpendingForm`
2. `POST /api/transaction` stores or simulates the transaction
3. `financeEngine` calculates spending ratios
4. `cityEngine` converts ratios into city metrics
5. `useCityStore` updates shared city state
6. `CityScene` and `CityGenerator` re-render the city
7. Dashboard calls `POST /api/insight`
8. AI insight is displayed in a teen-friendly card

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=your-openai-key
```

## Supabase Table Schema

Example schema for the `transactions` table:

```sql
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  amount numeric not null,
  category text not null check (category in ('Need', 'Want', 'Treat', 'Invest')),
  created_at timestamptz not null default timezone('utc', now())
);
```

## Getting Started

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Then open [http://localhost:3000](http://localhost:3000).

## Current UX Notes

- The app is styled mobile-first
- The city updates from shared Zustand state
- Local storage is used to keep the demo feeling stateful between page loads
- The current 3D city uses simple primitives so the team can iterate quickly
- The API layer is structured for easy replacement with stronger auth and DB logic later

## Hackathon Notes

This repo is intentionally optimized for speed of iteration:

- clear separation between UI, engines, APIs, and state
- reusable shared types in `types/index.ts`
- fallback behavior when Supabase or OpenAI keys are not set
- simple comments in core architecture files to help new contributors onboard quickly

## Suggested Next Steps

- add Supabase auth and user-specific transaction history
- persist full dashboard history instead of just the latest local demo state
- enhance the city with roads, parks, animations, and district zones
- add charts and trends to complement the 3D scene
- introduce tests for the finance and city engine logic
