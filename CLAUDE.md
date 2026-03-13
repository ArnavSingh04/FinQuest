# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
```

No test or lint scripts are configured.

## Environment Setup

Copy `.env.example` to `.env.local` and fill in:
- `OPENAI_API_KEY` — optional; AI advisor falls back to 5 pre-cached responses if absent
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — optional; app runs fully in localStorage mode without them

## Architecture

FinQuest is a gamified financial literacy PWA for teenagers. Users log transactions in 4 categories and watch a procedurally generated 3D city react in real time.

### Core Data Flow

```
User taps category → addTransaction() → calculateProportions() → generateCityState()
     → Zustand store updates → Three.js useFrame lerps buildings/weather
     → POST /api/insight → AI advisor message
```

**The city reacts instantly** (client-side math, zero network round-trip). The AI advisor call is async.

### Category → City Mapping

| Category | City element |
|----------|-------------|
| Need | Apartments (grey, count scales with needs %) |
| Want | Restaurants (orange, count scales with wants %) |
| Treat | Pollution clouds (opacity scales with treats %) |
| Invest | Bank tower (blue, height) + Investment tower (emerald cylinder, height) |

Health score drives weather: >75=clear, >50=overcast, >30=rain, else=storm.

### Key Files

| File | Purpose |
|------|---------|
| `lib/financeEngine.ts` | `calculateProportions(transactions)` — pure math |
| `lib/cityEngine.ts` | `generateCityState(proportions)` — cityMapper functions + health score |
| `lib/aiInsights.ts` | OpenAI `chat.completions.create` call with 5 fallback responses |
| `store/useGameStore.ts` | Single Zustand store — transactions, proportions, cityState, advisorMessage |
| `app/api/insight/route.ts` | POST — accepts `Proportions`, returns `{ insight: string }` |
| `app/api/transaction/route.ts` | POST — Supabase write path (optional, not used in local mode) |
| `components/city/CityGenerator.tsx` | All Three.js building components with `useFrame` lerp |
| `components/city/CityScene.tsx` | R3F Canvas, weather-driven lighting, roads |
| `components/spending/SpendingForm.tsx` | Transaction form + Simulate Payment button |
| `app/dashboard/page.tsx` | Main screen: form, health bar, proportions, advisor |
| `app/city/page.tsx` | Full-screen 3D city + compact form |

### State & Persistence

- `useGameStore` is the single source of truth
- `addTransaction()` computes new proportions + cityState instantly and writes to localStorage
- Keys: `fq-transactions`, `fq-proportions`, `fq-city-state`, `fq-advisor`
- `loadFromStorage()` must be called on page mount (done in `useEffect`)

### 3D City Details

- Buildings use `useRef<THREE.Mesh>` + `useFrame` with `THREE.MathUtils.lerp` for smooth transitions
- Never snap values — always lerp (speed = delta × 2.5)
- Weather changes background color + ambient/directional light intensity (also lerped)
- Rain particles are a `<Points>` component that animates in `useFrame`
- All geometry is procedural `BoxGeometry`/`CylinderGeometry` — no GLTF imports

### Stack

- **Next.js 16 / React 19** with App Router
- **React Three Fiber + Drei** for 3D
- **Zustand** for state
- **Tailwind CSS v4** for styling (tokens in `styles/tokens.css`)
- **OpenAI SDK** for AI coaching (optional)
- **Supabase** for optional persistence
