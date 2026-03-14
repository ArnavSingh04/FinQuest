# Diagnostic Report: City Not Updating After Logging Transactions

## 1. HOOK RESOLUTION

### Where is `useActiveCityState` defined?

- **Two definitions exist:**
  1. **`contexts/CityStateContext.tsx`** (lines 18–26): Exported hook that uses `useContext(CityStateContext)` and `useGameStore((state) => ({ cityState: state.cityState, proportions: state.proportions }))`, returns `override ?? gameState`.
  2. **`components/city/CityGenerator.tsx`** (lines 12–16): **Local** function (not imported) that uses `useCityStateOverride()` and two separate selectors:
     ```ts
     const storeCity = useGameStore((s) => s.cityState);
     const storeProps = useGameStore((s) => s.proportions);
     return override ?? { cityState: storeCity, proportions: storeProps };
     ```

- **CityGenerator does not import `useActiveCityState` from the context.** It imports only `useCityStateOverride` from `@/contexts/CityStateContext` and defines its own `useActiveCityState` in the same file. So the context’s `useActiveCityState` is never used by the city; the city uses the local hook only.

### What does it return in normal (non-shared) city view?

- When there is no Provider (or Provider value is null), `useCityStateOverride()` returns `null`.
- The local hook then returns `{ cityState: storeCity, proportions: storeProps }`, i.e. the current `cityState` and `proportions` from `useGameStore`.

### Is it actually reading from useGameStore or something else?

- Yes. The local `useActiveCityState` in CityGenerator reads from `useGameStore` via two selectors: `(s) => s.cityState` and `(s) => s.proportions`. So in normal view the city state comes from the store.

### Trace of every import of `useActiveCityState` across the codebase

- **Grep result:** No file **imports** `useActiveCityState`. The only references are:
  - Definition and export in `contexts/CityStateContext.tsx`.
  - Definition (local) and 14 call sites inside `components/city/CityGenerator.tsx` (Apartment, Restaurant, BankTower, InvestmentTower, Rain, Lightning, Embers, Stars, Car, BunnyRabbit, OfficeBuilding, School, Hospital, Mall, and the main `CityGenerator` component).
- So the context’s `useActiveCityState` is never imported or used anywhere. All usage is the local hook in CityGenerator.

---

## 2. STORE SUBSCRIPTION

### Does CityGenerator.tsx subscribe to useGameStore directly anywhere?

- Not by name “useGameStore” in the main component. The main component calls `useActiveCityState()` (the local hook), which internally calls:
  - `useGameStore((s) => s.cityState)`
  - `useGameStore((s) => s.proportions)`
- So CityGenerator **does** subscribe to the store indirectly via the local `useActiveCityState`. Every child that calls `useActiveCityState()` (Apartment, Restaurant, BankTower, etc.) also subscribes through the same two selectors.

### When useGameStore’s cityState changes, does CityGenerator re-render?

- In principle, yes. When `set({ transactions, proportions, cityState })` runs in `addTransaction`, both `cityState` and `proportions` are new object references. So:
  - `useGameStore((s) => s.cityState)` gets a new reference → subscriber re-renders.
  - `useGameStore((s) => s.proportions)` gets a new reference → subscriber re-renders.
- Any component that calls the local `useActiveCityState()` uses both selectors, so it should re-render when either changes.

### Are there any useMemo or useCallback calls that might prevent re-renders when cityState changes?

- **`useCallback`:** One relevant usage in CityGenerator (lines 1095–1106): `hoverProps` is created with `useCallback(..., [])`. It only returns event handlers (`onPointerOver` / `onPointerOut`); it does not close over `cityState` or `proportions`, so it does not block updates.
- **`useMemo`:** Used in WindowGrid (windows array), Rain (positions, fallFactors), and other components for geometry/positions. None of these memoize `cityState` or `proportions` in a way that would freeze the city. The main CityGenerator body does not use `useMemo` for state derived from `cityState` or `proportions`.
- So nothing in the code clearly prevents re-renders when `cityState` changes. If the city still doesn’t update, the cause is likely elsewhere (e.g. React tree / R3F, or a separate issue like persistence).

---

## 3. DATA FLOW TRACE

### When `addTransaction` is called in useGameStore — step-by-step

1. **Entry:** e.g. `LogSheetContent` calls `addTransaction({ amount, category, merchant_name, note })` (from `useGameStore((s) => s.addTransaction)`).

2. **Inside `addTransaction` (store):**
   - New transaction is pushed to `newTxs`.
   - `proportions = ratiosToProportions(calculateSpendingRatios(newTxs))` → new object.
   - `cityState = generateCityState(proportions, get().monthlyIncome, totalSpend)` → new object (from `lib/cityEngine.ts`).
   - `persist(...)` for transactions, proportions, cityState.
   - `set({ transactions: newTxs, proportions, cityState })` → store updates with new references.

3. **Proportions update:** Yes. New `proportions` is passed to `set()`. Any component that selects `(s) => s.proportions` will see the new value and re-render.

4. **CityState update:** Yes. New `cityState` from `generateCityState(...)` is passed to `set()`. Any component that selects `(s) => s.cityState` will see the new value and re-render.

5. **Reaching CityGenerator:** CityGenerator (and its children) use the local `useActiveCityState()`, which uses:
   - `useGameStore((s) => s.cityState)`
   - `useGameStore((s) => s.proportions)`
   So they are direct store subscribers. When `set(...)` runs, Zustand notifies these subscribers and they re-render with the new `cityState` and `proportions`. So the update **should** reach CityGenerator and every building that calls `useActiveCityState()`.

6. **Which buildings read from what:**
   - **From `cityState`:** Apartment (`apartmentCount`), Restaurant (`restaurantCount`), BankTower (`bankHeight`), InvestmentTower (`towerHeight`), Rain/Lightning/Embers/Stars (`weather`), Car/BunnyRabbit (`healthScore`), OfficeBuilding (`bankHeight`), School/Hospital/Mall visibility or counts, and main CityGenerator (`population`, `healthScore`, and derived counts). All of these go through the local `useActiveCityState()`.
   - **From `proportions`:** School (needs ≥ 40%), Hospital (investments ≥ 15%), Mall (wants ≥ 15%), and main CityGenerator (percentages and labels). Again via the same hook.

So the intended data flow is: **addTransaction → set(store) → useGameStore selectors in CityGenerator’s useActiveCityState → re-render of CityGenerator and all building components.** There is no extra layer (e.g. context) in the main app path that would intercept or replace this.

---

## 4. CONTEXT WRAPPING

### Is CityGenerator wrapped in CityStateContext.Provider anywhere?

- **Main app (CityLayout):** No. The tree is `CityLayout → CityScene → Canvas → SceneContents → CityGenerator`. `CityScene` renders `<Canvas>…<SceneContents preset={null} /></Canvas>` and does **not** use `CityCanvas` or `CityStateContext.Provider`. So in the default view there is no Provider around the city.
- **CityFullscreen overlay:** Uses `CityCanvas`, which **can** wrap with Provider: `if (override) return <CityStateContext.Provider value={override}>{canvas}</CityStateContext.Provider>`. When opening fullscreen from the main app, `CityCanvas` is called without `override`, so `override` is null and the Provider is not used. So still no override in that path.
- **Shared city view (e.g. member view):** If another route or component renders `CityCanvas` with `override={someOverride}`, then the Provider would supply that override and the city would show the override instead of the live store. That is only for “view another city” flows, not for the normal “my city” view.

### If yes, what value is passed to the Provider?

- When Provider is used (only when `CityCanvas` is given `override`), the value is the `override` prop (e.g. a snapshot of another member’s city). Not used on the main path.

### Could the Provider be supplying stale or default values that override the live store?

- On the **main path** (CityLayout → CityScene → Canvas → SceneContents → CityGenerator), there is **no** Provider. So `useCityStateOverride()` is always null and the local `useActiveCityState` always returns store values. So Provider is not the cause of stale or non-updating city on the main app.
- If in some code path the app did render `CityCanvas` with a non-null `override` (e.g. by mistake or for a shared-city feature), then that would override the store and the city would not reflect the current user’s transactions. That would be a bug only in that path.

---

## 5. COMPONENT TREE

### Full render tree from page down to CityGenerator

- **App entry (e.g. `app/page.tsx`):** When logged in, renders `CityLayout`.
- **CityLayout** (`components/layout/CityLayout.tsx`):
  - Subscribes to: `useUIStore` (activeSheet), `useGameStore(loadFromStorage)`.
  - Does **not** subscribe to `cityState` or `proportions`.
  - Renders:
    - div (city layer) → **CityScene** (`height="h-full"`).
    - TopHUD, BottomActionCard, BottomSheet (with SheetContent: LogSheetContent, etc.).
- **CityScene** (`components/city/CityScene.tsx`):
  - No store subscription.
  - Renders: div → **Canvas** (from `@react-three/fiber`) → **SceneContents** (from CityFullscreen, `preset={null}`).
  - Does **not** use CityCanvas or Provider.
- **SceneContents** (`components/city/CityFullscreen.tsx`):
  - No store subscription. Props: `preset={null}`.
  - Renders: PerspectiveCamera, SceneFog, SkyBackground, Lights, ground/road meshes, **CityGenerator**, CameraController.
- **CityGenerator** (`components/city/CityGenerator.tsx`):
  - Subscribes via local `useActiveCityState()` → `useGameStore((s) => s.cityState)` and `useGameStore((s) => s.proportions)`.
  - Renders: group → roads, buildings (Apartment, Restaurant, BankTower, InvestmentTower, etc.), traffic, trees, etc. Each building component that needs state calls `useActiveCityState()` again.

### Intermediate components that might block state propagation

- **CityLayout:** Subscribes only to `activeSheet` and `loadFromStorage`. When `addTransaction` runs, CityLayout does **not** re-render from that update. That is fine: the store update only needs to re-render subscribers of `cityState`/`proportions`, i.e. CityGenerator and its children.
- **CityScene:** Does not subscribe to the store. It does not need to; CityGenerator is the subscriber.
- **Canvas (R3F):** R3F’s Canvas may use an internal React root or scheduler for the WebGL tree. If the tree under Canvas were in a different root, store updates would still be visible to any component under Canvas that calls `useGameStore`, because the store is a module-level singleton. So in theory, CityGenerator (under Canvas) should still re-render when the store updates. If in practice the city does not update, it would be worth verifying whether R3F’s Canvas or its root/react-three-fiber version could delay or drop updates (e.g. batching, or not flushing to the Canvas tree).
- **SceneContents:** Pure pass-through; no memo and no subscription. It does not block propagation.

---

## Summary of findings

- The city uses a **local** `useActiveCityState` in CityGenerator that **does** read from `useGameStore` (`cityState` and `proportions`). The context’s `useActiveCityState` is never used by the city.
- There is **no** `CityStateContext.Provider` on the main path (CityLayout → CityScene → Canvas → SceneContents → CityGenerator), so no override is applied; the city should always reflect the store.
- **Data flow** from `addTransaction` to the store and then to CityGenerator is correct: `set({ proportions, cityState })` should trigger re-renders for all components that call the local `useActiveCityState()`.
- No `useMemo`/`useCallback` in the traced code obviously blocks re-renders when `cityState`/`proportions` change.

If the city still does not update after logging a transaction, the next places to check are:

1. **React Three Fiber / Canvas:** Whether the R3F Canvas (or its root) behaves in a way that prevents or delays re-renders of components that subscribe to Zustand (e.g. different root, batching, or frame loop).
2. **Persistence / hydration:** Whether `loadFromStorage` or another effect runs after `addTransaction` and overwrites store state (e.g. reading stale data from localStorage or SSR).
3. **Selector stability:** Whether something (e.g. middleware or devtools) is replacing or wrapping the store so that `cityState`/`proportions` references do not change when expected.
4. **Unifying the hook:** Consider having CityGenerator import and use the context’s `useActiveCityState` instead of the local duplicate, so there is a single source of truth and the context’s behavior (override vs store) is consistent everywhere.
