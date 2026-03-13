# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
```

No test or lint scripts are configured.

## Environment Setup

Copy `.env.example` to `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — optional; app falls back to local-only mode
- `OPENAI_API_KEY` — optional; AI insights fall back to static text

## Architecture

FinQuest is a gamified financial literacy PWA for teenagers. Users log transactions in 4 categories, and their spending ratios are visualized as a procedurally generated 3D city.

### Data Flow

1. User submits a transaction (`amount` + `category`) via `SpendingForm`
2. `POST /api/transaction` validates and optionally persists to Supabase
3. `financeEngine.ts` computes spending ratios from the transaction list
4. `cityEngine.ts` maps those ratios to `cityMetrics` (housing, entertainment, pollution, growth)
5. Zustand store (`useCityStore`) holds `cityMetrics` and syncs to localStorage
6. `CityGenerator.tsx` reads the store and procedurally generates Three.js buildings

### Category → City Mapping

| Category | City element |
|----------|-------------|
| Need | Blue houses (housing/stability) |
| Want | Purple/orange buildings (entertainment) |
| Treat | Gray translucent spheres (pollution) |
| Invest | Green skyscrapers (growth) |

### Key Files

| File | Purpose |
|------|---------|
| `lib/financeEngine.ts` | Spending ratio calculations |
| `lib/cityEngine.ts` | `ratioToMetric()` — maps ratios to city metrics |
| `lib/aiInsights.ts` | OpenAI GPT-4.1-mini coaching with fallback |
| `lib/supabase.ts` | Supabase client (optional) |
| `store/useCityStore.ts` | Zustand store for city metrics + localStorage sync |
| `app/api/transaction/route.ts` | Transaction endpoint; returns `{ cityMetrics, ratios, transactions, mode }` |
| `app/api/insight/route.ts` | AI insight endpoint; accepts ratios, returns advice |
| `components/city/CityGenerator.tsx` | Procedural Three.js building generation |
| `components/city/CityScene.tsx` | React Three Fiber canvas + lighting setup |
| `components/spending/SpendingForm.tsx` | Transaction input form |
| `app/dashboard/page.tsx` | Main app screen with form, ratio cards, metric cards, AI tips |
| `app/city/page.tsx` | Full-screen 3D city view |

### State & Persistence

- Zustand (`useCityStore`) is the single source of truth for city metrics
- Data persists via localStorage; Supabase is additive, not required
- Both API routes return gracefully if external services are unavailable

### Stack

- **Next.js 16 / React 19** with App Router
- **Three.js + React Three Fiber + Drei** for 3D rendering
- **Zustand** for state management
- **Tailwind CSS v4** for styling (design tokens in `styles/tokens.css`)
- **Supabase** for optional persistence
- **OpenAI SDK** for AI coaching
