# Spec 01 — Foundation: Design

This document describes how each requirement will be implemented. It is the
blueprint for `tasks.md`. Nothing here is application code; it is the agreed
plan that tasks will execute against.

---

## 1. Project scaffolding

### 1.1 Initialisation

Create the Next.js project with the App Router, TypeScript in strict mode and
Tailwind CSS using `create-next-app`. Then install the remaining approved
dependencies in a single `npm install` call.

```
npx create-next-app@latest . \
  --typescript --tailwind --app --src-dir --import-alias "@/*" --no-git
```

Install additional packages:
```
npm install zustand zod framer-motion lucide-react clsx
npm install -D vitest @testing-library/react @testing-library/user-event
           jsdom @vitejs/plugin-react tsx
```

### 1.2 TypeScript config

`tsconfig.json` must have `"strict": true` and the path alias
`"@/*": ["./src/*"]`. The `next/tsconfig.json` base already satisfies most
requirements; we add only what it lacks.

### 1.3 Vitest config

Create `vitest.config.ts` at the repo root. Use the `@vitejs/plugin-react`
plugin and set the environment to `jsdom`. Add a `setupFiles` entry pointing to
`tests/setup.ts` (which imports `@testing-library/react`'s cleanup helper).

```ts
// vitest.config.ts (shape, not final code)
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
})
```

### 1.4 npm scripts

Add to `package.json`:
```json
"typecheck": "tsc --noEmit",
"validate:case": "tsx scripts/validate-case.ts"
```

The `lint` and `test` scripts come from `create-next-app` and Vitest
respectively.

### 1.5 .gitignore

Write `.gitignore` to cover `.env*` (with a negation for `.env.example`),
`node_modules/`, `.next/`, `out/`, `coverage/`, `.DS_Store`, `*.local`.
`.kiro/` is explicitly **not** ignored.

---

## 2. Design tokens and global styles

### 2.1 tokens.css

`src/styles/tokens.css` defines every token as a CSS custom property on
`:root`. It also sets `--haunt-level: 0`.

```css
:root {
  --obsidian: #171419;
  --ink: #0E0C10;
  --burgundy: #421D29;
  --parchment: #D8C8AC;
  --parchment-light: #EADFC9;
  --parchment-dark: #B9A98C;
  --gold: #A58A60;
  --brown: #51413D;
  --candle: #E8B15D;
  --thread: #B5483A;
  --entity: #8F1D2C;
  --entity-glow: #C0283D;
  --verdigris: #5F7F6B;
  --haunt-level: 0;
}
```

### 2.2 Tailwind config

`tailwind.config.ts` extends the default theme's `colors` with one entry per
token, referencing the CSS variable so runtime theme changes propagate
automatically:

```ts
colors: {
  obsidian:        'var(--obsidian)',
  ink:             'var(--ink)',
  burgundy:        'var(--burgundy)',
  parchment:       'var(--parchment)',
  'parchment-light': 'var(--parchment-light)',
  'parchment-dark':  'var(--parchment-dark)',
  gold:            'var(--gold)',
  brown:           'var(--brown)',
  candle:          'var(--candle)',
  thread:          'var(--thread)',
  entity:          'var(--entity)',
  'entity-glow':   'var(--entity-glow)',
  verdigris:       'var(--verdigris)',
}
```

### 2.3 globals.css

Imports `tokens.css`, sets `body { background-color: var(--obsidian);
color: var(--parchment); }`, and applies `font-family: var(--font-inter)` as
the default body font.

### 2.4 Fonts

In `src/app/layout.tsx`, load all four fonts via `next/font/google` and expose
them as CSS variables:

| Font | CSS variable |
|---|---|
| Cinzel | `--font-cinzel` |
| Cormorant Garamond | `--font-cormorant` |
| Inter | `--font-inter` |
| Caveat | `--font-caveat` |

Apply all four variables to the `<html>` element so every component can
reference them via `var(--font-*)`.

### 2.5 token-check lint rule

Implement as a custom ESLint rule or a small Node script
(`scripts/token-check.ts`) that the `token-check` hook calls. It scans
`src/components/**/*.tsx` for:
- Hex literals matching `/#[0-9a-fA-F]{3,8}/`
- `font-family` or `fontFamily` values that are not `var(--font-*)`
- The strings `--entity` or `--entity-glow` in files whose path does not
  include `components/entity/`

It prints offending file + line and exits with code 1 if any are found.

---

## 3. Base UI components

All components live under `src/components/ui/` and are exported from
`src/components/ui/index.ts`.

### 3.1 Button

Props: `variant: 'primary' | 'secondary' | 'ghost'`, `loading?: boolean`,
`disabled?: boolean`, `tooltip?: string`, `onClick`, standard button HTML
attributes.

- Renders a `<button>` element.
- Applies variant-specific Tailwind classes (using `clsx`).
- Disabled: `opacity-50 cursor-not-allowed`. Wraps in a `<span
  title={tooltip}>` when `tooltip` is provided so the tooltip shows on hover
  even when the button is disabled.
- Loading: renders the candle-flame SVG spinner inline; sets
  `aria-busy="true"`.
- Focus ring: `focus-visible:ring-2 focus-visible:ring-gold
  focus-visible:outline-none`.
- Primary variant gets the ornamental frame (a thin `box-shadow` or
  `border-image` using `--burgundy` to `--entity` gradient).

### 3.2 Modal

Props: `open: boolean`, `onClose: () => void`, `title?: string`,
`children: ReactNode`.

- Renders a `<dialog>` element (native) with a backdrop.
- Animated with Framer Motion (`AnimatePresence` + `motion.div`).
- Closes on Escape key and on backdrop click.
- Focus is trapped inside while open.
- Background overlay: `--ink` at 85% opacity.

### 3.3 Toast

Props: `message: string`, `variant: 'info' | 'success' | 'error'`,
`duration?: number` (default 3000 ms).

- Fixed position, bottom-right.
- Auto-dismisses after `duration`. Can be manually dismissed.
- Animated in/out with Framer Motion.

### 3.4 ProgressBar

Props: `value: number` (0–100), `label?: string`.

- A `<div role="progressbar" aria-valuenow={value}
  aria-valuemin={0} aria-valuemax={100}`.
- Track in `--burgundy`, fill in `--gold`, animated width transition.

### 3.5 Stamp

Props: `label: string`, `variant: 'unresolved' | 'solved'`.

- An SVG `<text>` element, rotated ~15° counter-clockwise.
- `unresolved`: deep red fill, rough stroke. `solved`: `--verdigris` fill.
- Font: Cinzel, weight 700, uppercase.

### 3.6 WaxSeal

No props (decorative). A small circular SVG wax seal in `--burgundy` with an
"A" monogram (for Ashworth).

### 3.7 ArchiveFrame

Props: `children: ReactNode`, `className?: string`.

- A `<div>` with `border: 1px solid var(--gold)` and four decorative corner
  SVG marks (absolute-positioned `<svg>` elements, 12×12 px each).

### 3.8 ParchmentCard

Props: `children: ReactNode`, `className?: string`, `tilt?: number` (degrees,
default 0).

- Background: `--parchment-dark`. Border-radius: 2 px.
- Warm shadow: `0 4px 24px rgba(14,12,16,0.6)`.
- `transform: rotate({tilt}deg)` when `tilt` is non-zero.

### 3.9 CaseFolder

Props: `caseNumber: string`, `title: string`, `teaser: string`,
`status: 'unresolved' | 'solved'`, `progress: number`.

- Composes `ParchmentCard` (with `tilt={1}`), `Stamp` and `ProgressBar`.
- Renders case number and title in Cormorant Garamond weight 700.
- Teaser in Inter 16 px.

### 3.10 Component gallery (dev only)

Route `/gallery` — created as `src/app/gallery/page.tsx`. It imports and
renders every component in every meaningful state. Excluded from production via:

```ts
// src/app/gallery/page.tsx
if (process.env.NODE_ENV === 'production') notFound()
```

---

## 4. Case data types and Zod schemas

### 4.1 File structure

`src/types/index.ts` only. All types inferred from Zod schemas via
`z.infer<typeof Schema>`.

### 4.2 Schema design decisions

**`ConditionSchema`** uses a recursive `z.lazy()` to allow nested `allOf` /
`anyOf`. Because TypeScript cannot infer recursive types from `z.infer`, we
write one explicit `type Condition = ...` by hand as the exception permitted
by AC-04-5.

**`EvidenceSchema`** marks `authenticity` as defaulting to `'genuine'` using
`.default('genuine')` so data files need not repeat it on every entry.

**`WitnessFactSchema`** marks `lieAllowedUntil`, `deniedLine` and
`forbiddenTokens` as optional with defaults so simple facts need minimal
boilerplate.

**`GameStateSchema`** contains a `version: z.literal(1)` field. The store
uses this to detect schema migrations.

### 4.3 Validation at import time

Each data file calls `z.array(Schema).parse(dataArray)` at the top level.
This means any shape error throws immediately when the module is first imported,
whether by the app, by tests or by the validation script.

---

## 5. Case 001 data files

### 5.1 Authoring approach

Each file exports a `const` array typed with the inferred Zod type. All string
IDs are written as the exact strings from the master brief (e.g. `"EV-07"`,
`"OBJ-clock"`). No computed or dynamic IDs.

### 5.2 `truth.ts`

Exports `CASE_TRUTH`: a plain object of authored strings (the five answers,
the entity identity, Clara's final voicemail text, the static reveal narration
fallback). None of these strings are ever modified by the AI.

### 5.3 `witnesses.ts` — fact ordering

Facts are listed in the order they can be revealed (always-available first,
then conditional). `forbiddenTokens` for each locked fact are derived from
proper nouns and times mentioned in the fact's `truth` field.

### 5.4 `digital.ts` — texture records

The 8–10 texture `DigitalRecord` objects have `yieldsEvidence: undefined` and
contain plausible 2008 family content (a grocery list email, a school-run
reminder SMS, a birthday photo caption). They are authored to give the player
something to compare against without yielding game-state evidence.

### 5.5 `index.ts`

Assembles and exports:
```ts
export const CASE_001 = {
  truth: CASE_TRUTH,
  timeline: TIMELINE_EVENTS,
  evidence: EVIDENCE_ITEMS,
  scene: SCENE_OBJECTS,
  digital: DIGITAL_RECORDS,
  witnesses: WITNESSES,
  contradictions: CONTRADICTION_RULES,
  links: LINK_RULES,
  entityRules: ENTITY_RULES,
}
export type Case001 = typeof CASE_001
```

---

## 6. Case validation script

### 6.1 Algorithm

`scripts/validate-case.ts` does the following in sequence:

1. Import `CASE_001` from `src/data/case001/index.ts`.
2. Build lookup sets: `evidenceIds`, `timelineIds`, `sceneObjectIds`,
   `statementIds` (from `WitnessFact.yieldsStatementId`).
3. Run each check below. Collect all failures before exiting (do not stop at
   the first).
4. Print result and exit.

### 6.2 Checks

| Check | What it validates |
|---|---|
| Scene yields | Each `SceneObject.yieldsEvidence[]` ∈ `evidenceIds` |
| Digital yields | Each `DigitalRecord.yieldsEvidence` ∈ `evidenceIds` (if set) |
| Contradiction sides | Each `ContradictionRule.{a,b}` ∈ `evidenceIds ∪ statementIds` |
| Link pairs | Each `LinkRule.{a,b}` ∈ `evidenceIds` |
| Entity target refs | Each `EntityRule.targetRef` ∈ `evidenceIds ∪ sceneObjectIds` (if set) |
| Timeline back-refs | Each ID in `Evidence.relatedEvents[]` ∈ `timelineIds` |
| Duplicate IDs | No two items in any single array share the same `id` |

---

## 7. Zustand store

### 7.1 Store shape

`src/store/gameStore.ts` defines the initial state and all actions as a single
Zustand store. Actions are grouped by domain:

| Group | Actions |
|---|---|
| Investigation | `startInvestigation(name)`, `discoverObject(id)`, `inspectObject(id)`, `collectEvidence(id)` |
| Digital | `recoverRecord(id)` |
| Witness | `addChatTurn(witnessId, turn)`, `setTrust(witnessId, value)`, `revealFact(factId)`, `markEvidencePresented(witnessId, evidenceId)` |
| Board | `addLink(a, b, verdict)`, `setCardPosition(id, pos)`, `placeTimelineEvent(slot, eventId)`, `flagContradiction(id)` |
| Entity | `addAttention(delta)`, `fireRule(ruleId)`, `disturbEvidence(id)`, `lockObject(id, until)`, `addEntityMessage(msg)`, `plantEvidence(id)` |
| Theory | `setTheory(theory)`, `setVerdict(verdict)` |
| UI | `setLastRoute(route)`, `toggleMute()`, `markIntroSeen()` |
| Meta | `resetStore()` |

### 7.2 Persistence config

```ts
persist(store, {
  name: 'haunting-save-v1',
  storage: createJSONStorage(() => localStorage),
  onRehydrateStorage: () => (state) => {
    if (state && state.version !== CURRENT_VERSION) {
      state.resetStore()
    }
  },
})
```

### 7.3 Hydration guard

`src/store/useHydrated.ts` exports a hook that returns `false` until the
persist middleware fires its `onFinishHydration` callback. The root layout
renders `<HydrationGuard>` which shows a neutral dark screen until this
hook returns `true`.

### 7.4 Selectors

`src/store/selectors.ts` — pure functions, no store subscription inside them.
They accept `state` (or a subset) and `caseData` as parameters.

**`selectProgress`:**
```
progress = round(100 × (
  0.40 × (collected genuine / 15) +
  0.20 × (confirmed contradictions / 7) +
  0.20 × (valid links / 13) +
  0.10 × (non-default revealed facts / total non-default facts) +
  0.10 × (placed timeline slots / 7)
))
```
Clamp to 0–100.

**`selectRank`:** maps score ranges to rank strings per §11.5.

**`selectUnlockedSections`:**
- `scene`: always `true`
- `archive`: `collectedEvidence` includes both `EV-01` and `EV-07`
- `witnesses`: count of `{EV-11,EV-12,EV-13,EV-14,EV-15}` in
  `collectedEvidence` ≥ 3
- `conclusion`: collected evidence count ≥ 10, confirmed contradictions ≥ 3,
  revealed non-default facts ≥ 6

**`selectAvailableContradictions`:** returns `ContradictionRule[]` where both
`a` and `b` are in `collectedEvidence` or in
`revealedFacts` (for statement IDs).

---

## 8. Title screen

### 8.1 Layout

`src/app/page.tsx` is a Client Component (`'use client'`). It reads hydration
state and store state; it must not render until hydrated.

Layer order (all `position: absolute`, `inset: 0`):
1. Mansion `<Image>` (Next.js `Image`, `fill`, `priority`, `object-cover`).
   Falls back gracefully if the file is absent (the `<Image>` component renders
   a broken-image placeholder rather than crashing).
2. A gradient overlay: `linear-gradient(to top, rgba(14,12,16,0.85) 40%,
   transparent 100%)`.
3. Mist layer: a semi-transparent PNG or SVG, animated with
   `@keyframes drift` (horizontal translate, 60 s, infinite, alternate).
   Disabled when `prefers-reduced-motion: reduce`.
4. Content centred on the lower half:
   - "THE" in Cinzel 14 px, letter-spacing wide, `--parchment-dark`.
   - "HAUNTING" in Cinzel clamp(48px, 10vw, 96px), `--parchment`.
   - 1 px horizontal rule in `--gold`.
   - Tagline in Cormorant Garamond 18 px, `--parchment-dark`.
   - `Button` (primary).
5. Mute toggle: `position: fixed`, bottom-right, `z-index: 50`.

### 8.2 Save-detection logic

On mount (after hydration), read `investigator.name` from the store.
- If truthy: button = "CONTINUE INVESTIGATION", show "New Investigation" link.
- If empty: button = "BEGIN INVESTIGATION".

"New Investigation" triggers a `Modal` asking "Start a new investigation? Your
current progress will be lost." with Confirm and Cancel buttons. Confirm calls
`resetStore()` then navigates to `/hq`.

### 8.3 Navigation

Use Next.js `useRouter().push('/hq')` on button click. No hard `<a href>`.

---

## 9. Investigation HQ

### 9.1 Layout

`src/app/hq/page.tsx` — Client Component.

Three-region layout:
- `<TopBar>` — fixed height, `--burgundy` background, `--gold` bottom border.
- `<main>` — flex row, padding, two columns:
  - Left (~60%): `CaseFolder` + investigator stats below it.
  - Right (~40%): house photo in `ArchiveFrame` + Key Evidence panel below.
- `<NotificationTray>` — fixed bottom-left, shown only when
  `entity.messages.length > 0`.

### 9.2 TopBar

Left: a small SVG crest placeholder + "THE HAUNTING" in Cinzel 20 px.
Centre: `<nav>` with links: Cases → `/hq`; Evidence → `/case/001/evidence`;
Archive → `/case/001/archive`; Profile → `/profile` (placeholder, not
implemented this spec). Active link gets a `--gold` underline.
Right: investigator name + rank title in Inter 14 px.

### 9.3 CaseFolder content

- `caseNumber="CASE 001"`, `title="The House That Calls Back"`
- `teaser`: three lines of static authored text:
  > A family vanished on a November night in 2008. The house on Hollow Lane has
  > been silent for eighteen years. Every night at 11:13, someone calls.
- `status`: `'solved'` if `verdict` is set in store, else `'unresolved'`.
- `progress`: from `selectProgress`.

### 9.4 Key Evidence panel

A `ParchmentCard` with heading "Key Evidence" in Cormorant Garamond 500.
Maps the most recent 6 items from `collectedEvidence` (by `at` timestamp,
descending) to their `name` from `CASE_001.evidence`.
Empty state: italic "Nothing recovered yet" in Caveat.

### 9.5 Investigator stats

Four labelled values in a 2×2 grid:
- Evidence found: `Object.keys(collectedEvidence).length`
- Contradictions flagged: `contradictionsFlagged.length`
- Witnesses questioned: count of `Object.keys(witnessChats)` with ≥ 1 turn
- Time played: `Math.floor((Date.now() - investigator.startedAt) / 60000)` min

### 9.6 Continue button

Reads `ui.lastRoute`. If set and the route is in the allowed list
(`/case/001/scene`, `/case/001/archive`, `/case/001/witnesses/*`,
`/case/001/evidence`), navigate there. Otherwise navigate to
`/case/001/scene`.

Before navigating, call `setLastRoute(target)` to persist the destination.

### 9.7 Candle decoration

A small `<svg>` candle flame at the bottom-left corner of the main content area.
A CSS `@keyframes flicker` animation varies `opacity` between 0.7 and 1.0 over
2 s, infinite, with a slight scale variation. Disabled with
`prefers-reduced-motion`.

---

## 10. Component and data interaction map

```
src/app/page.tsx (title)
  └── uses: Button, Modal
  └── reads: gameStore (investigator.name, ui.muted)
  └── writes: gameStore (resetStore, toggleMute)

src/app/hq/page.tsx
  └── uses: TopBar, CaseFolder, ArchiveFrame, ParchmentCard,
            Button, ProgressBar, Stamp, NotificationTray
  └── reads: gameStore (all fields needed for display)
  └── selectors: selectProgress, selectRank, selectUnlockedSections,
                 selectAvailableContradictions
  └── reads: CASE_001 (evidence names, case metadata)

src/store/gameStore.ts
  └── depends on: src/types/index.ts (GameState shape)
  └── depends on: src/store/migrations.ts (version check)
  └── exposes selectors via: src/store/selectors.ts

src/data/case001/index.ts
  └── validated by: scripts/validate-case.ts
  └── parsed at import by: Zod schemas in src/types/index.ts
```

---

## 11. What is explicitly out of scope for this spec

- Scene hotspots and object inspection (Spec 02)
- Digital Archives device UI (Spec 02)
- Witness interrogation and AI calls (Spec 03)
- Entity rule engine (Spec 03)
- Evidence board, threads, contradictions (Spec 04)
- Theory form and scoring (Spec 04)
- Reveal sequence (Spec 04)
- Sound (P1, Spec 04)
- Mobile layout (addressed in responsive pass, Spec 04)
