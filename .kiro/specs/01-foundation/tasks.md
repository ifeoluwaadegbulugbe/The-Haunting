# Spec 01 — Foundation: Tasks

Each task touches at most five files. After every task, run `typecheck`, `lint`
and `validate:case` (where applicable), then commit.

Completion signal for the whole spec: `npm run dev` shows the title screen and
HQ with real store values; `npm run build` is clean; `npm run test` passes;
`npm run validate:case` passes.

---

## Task 1.1 — Project scaffolding and tooling

**Files touched:** `package.json`, `tsconfig.json`, `vitest.config.ts`,
`tests/setup.ts`, `.gitignore`

**Steps:**
1. Initialise the Next.js project (App Router, TypeScript, Tailwind, `src/`
   dir, `@/` alias) inside the existing repo directory.
2. Install additional approved dependencies:
   `zustand zod framer-motion lucide-react clsx` and dev deps
   `vitest @testing-library/react @testing-library/user-event jsdom
   @vitejs/plugin-react tsx`.
3. Add `"typecheck": "tsc --noEmit"` and
   `"validate:case": "tsx scripts/validate-case.ts"` to `package.json` scripts.
4. Create `vitest.config.ts` — jsdom environment, `@vitejs/plugin-react`,
   globals true, `@/` alias pointing to `src/`, setupFiles to
   `tests/setup.ts`.
5. Create `tests/setup.ts` — imports `@testing-library/react`'s
   `cleanup` and calls it `afterEach`.
6. Write `.gitignore`:
   ```
   .env*
   !.env.example
   node_modules/
   .next/
   out/
   coverage/
   .DS_Store
   *.local
   ```

**Done when:**
- AC-01-1 through AC-01-11 pass.
- `npm run dev`, `npm run build`, `npm run typecheck`, `npm run lint`,
  `npm run test` all exit cleanly.

---

## Task 1.2 — Design tokens, fonts and global styles

**Files touched:** `src/styles/tokens.css`, `src/styles/globals.css`,
`tailwind.config.ts`, `src/app/layout.tsx`

**Steps:**
1. Create `src/styles/tokens.css` with all 13 colour tokens and
   `--haunt-level: 0` on `:root` (exact values from `design-system.md`).
2. Update `tailwind.config.ts`:
   - Extend `theme.colors` with one entry per token, each referencing
     `'var(--token-name)'`.
   - Add `content` paths to cover `src/app/**` and `src/components/**`.
3. Update `src/styles/globals.css`:
   - `@import './tokens.css'`
   - Set `body` background to `var(--obsidian)` and color to
     `var(--parchment)`.
   - Set `body` font-family to `var(--font-inter)`.
4. Update `src/app/layout.tsx`:
   - Load Cinzel, Cormorant Garamond (weights 500, 600, 700), Inter, and
     Caveat via `next/font/google`.
   - Apply all four as CSS variables on `<html>`:
     `className={[cinzel.variable, cormorant.variable, inter.variable,
     caveat.variable].join(' ')}`.
   - Import `globals.css` here.

**Done when:**
- AC-02-1 through AC-02-5 pass.
- A browser dev-tools inspection of `:root` shows all 13 token variables.
- Font variables are present on `<html>`.

---

## Task 1.3 — Base UI components (Button, Modal, Toast, ProgressBar)

**Files touched:** `src/components/ui/Button.tsx`,
`src/components/ui/Modal.tsx`, `src/components/ui/Toast.tsx`,
`src/components/ui/ProgressBar.tsx`

**Steps:**
1. **Button** — props: `variant`, `loading`, `disabled`, `tooltip`,
   `children`, forwarded HTML button attrs.
   - Use `clsx` for variant + state classes.
   - Disabled: wrap in `<span title={tooltip}>` when tooltip provided.
   - Loading: inline candle-flame SVG (a simple teardrop path in `--candle`),
     `aria-busy="true"`.
   - Focus ring: `focus-visible:ring-2 focus-visible:ring-gold
     focus-visible:outline-none`.
   - Primary ornamental frame: `box-shadow: inset 0 0 0 1px var(--burgundy),
     inset 0 0 0 2px var(--entity)` — no raw hex, uses token variables.
2. **Modal** — props: `open`, `onClose`, `title`, `children`.
   - Native `<dialog>` element, `ref` + `useEffect` to call `.showModal()` /
     `.close()`.
   - Backdrop: `::backdrop` CSS with `--ink` at 85% opacity.
   - `AnimatePresence` + `motion.div` for fade-in/out (≤ 300 ms).
   - Escape key and backdrop click call `onClose`.
3. **Toast** — props: `message`, `variant`, `duration` (default 3000),
   `onDismiss`.
   - Fixed bottom-right, Framer Motion slide-up animation.
   - Auto-dismiss via `useEffect` timeout.
4. **ProgressBar** — props: `value` (0–100), `label`.
   - `role="progressbar"` with `aria-valuenow`, `aria-valuemin`,
     `aria-valuemax`.
   - Track `--burgundy`, fill `--gold`, animated width via CSS transition.

**Done when:**
- AC-03-1 (partial — these four), AC-03-2, AC-03-3, AC-03-8, AC-03-9 pass.
- Each component renders in isolation without console errors.

---

## Task 1.4 — Base UI components (Stamp, WaxSeal, ArchiveFrame,
ParchmentCard, CaseFolder)

**Files touched:** `src/components/ui/Stamp.tsx`,
`src/components/ui/WaxSeal.tsx`, `src/components/ui/ArchiveFrame.tsx`,
`src/components/ui/ParchmentCard.tsx`, `src/components/ui/CaseFolder.tsx`

**Steps:**
1. **Stamp** — SVG with `<text>` rotated −15°.
   - `unresolved`: fill `--entity`, rough SVG stroke effect.
   - `solved`: fill `--verdigris`.
   - Font: Cinzel 700 uppercase via `font-family: var(--font-cinzel)`.
2. **WaxSeal** — small circular SVG (40 × 40 px) in `--burgundy` with an
   "A" monogram in `--parchment-light`.
3. **ArchiveFrame** — `<div>` with `border: 1px solid var(--gold)` and four
   corner SVG marks (absolute-positioned, 12 × 12 px, inline SVG `<path>`
   drawing an L-shaped bracket).
4. **ParchmentCard** — `<div>` with background `--parchment-dark`,
   `border-radius: 2px`, warm shadow, `transform: rotate({tilt}deg)`.
5. **CaseFolder** — composes `ParchmentCard` (tilt=1), `Stamp`, `ProgressBar`.
   - Renders case number in Cormorant Garamond 700, title in Cormorant
     Garamond 600, teaser in Inter 16 px.
6. Create `src/components/ui/index.ts` exporting all nine components.

**Done when:**
- AC-03-1 (all nine components), AC-03-4 through AC-03-7, AC-03-8 pass.
- No raw hex values in any component file.

---

## Task 1.5 — Component gallery page

**Files touched:** `src/app/gallery/page.tsx`

**Steps:**
1. Create `src/app/gallery/page.tsx` as a Client Component.
2. First line of the component function:
   `if (process.env.NODE_ENV === 'production') notFound()`
3. Render a dark-background page with sections for each component, showing
   every meaningful state:
   - Button: all three variants × default/hover/focus/disabled/loading.
   - Modal: a trigger button that opens it.
   - Toast: a trigger that shows each variant.
   - ProgressBar: 0, 33, 67, 100.
   - Stamp: unresolved + solved.
   - WaxSeal, ArchiveFrame, ParchmentCard (tilt 0 and 1).
   - CaseFolder with mock props.

**Done when:**
- AC-03-7 passes: `/gallery` renders in dev, returns 404 in a production build.

---

## Task 1.6 — Zod schemas and TypeScript types

**Files touched:** `src/types/index.ts`

**Steps:**
1. Define Zod schemas in this order (each depends on the previous):
   `ConditionSchema` (recursive, using `z.lazy`), `AuthenticitySchema`,
   `ReliabilitySchema`, `EvidenceKindSchema`, `EvidenceSchema`,
   `SceneObjectSchema`, `DigitalRecordSchema`, `WitnessFactSchema`,
   `WitnessSchema`, `TimelineEventSchema`, `ContradictionRuleSchema`,
   `LinkRuleSchema`, `EntityRuleSchema`, `TheorySchema`, `GameStateSchema`.
2. For `ConditionSchema`, write the one manual type alias:
   ```ts
   export type Condition = {
     allOf?: Array<{ type: ConditionCheck; ref: string | number }>
     anyOf?: Array<{ type: ConditionCheck; ref: string | number }>
   }
   ```
3. Export all schemas and their inferred types.
4. `GameStateSchema` includes `version: z.literal(1)`.

**Done when:**
- AC-04-1 through AC-04-5 pass.
- `npm run typecheck` is clean.

---

## Task 1.7 — Case 001 data files

**Files touched:** `src/data/case001/truth.ts`,
`src/data/case001/timeline.ts`, `src/data/case001/evidence.ts`,
`src/data/case001/scene.ts`, `src/data/case001/digital.ts`

**Steps:**
1. `truth.ts` — export `CASE_TRUTH` object with keys:
   `entityIdentity`, `fiveAnswers` (object with five string values),
   `finalVoicemail` (Clara's authored text), `revealNarrationFallback`
   (static 120–160 word narration), `caseTeaser` (three-line HQ text).
2. `timeline.ts` — export `TIMELINE_EVENTS`: array of 7 `TimelineEvent`
   objects, IDs `TL-01`–`TL-07`, matching §9.3 exactly.
   Call `TimelineEventSchema.array().parse(TIMELINE_EVENTS)` at the bottom.
3. `evidence.ts` — export `EVIDENCE_ITEMS`: array of 16 `Evidence` objects,
   IDs `EV-01`–`EV-15` and `EV-X1`, matching §9.4 exactly.
   `EV-X1` has `authenticity: 'manipulated'` and `relevance: 'red-herring'`.
   Call `EvidenceSchema.array().parse(EVIDENCE_ITEMS)`.
4. `scene.ts` — export `SCENE_OBJECTS`: array of 9 `SceneObject` objects,
   IDs `OBJ-telephone`–`OBJ-rug`, matching §9.5. Hotspot coordinates are
   placeholder percentages (to be refined when the scene image is placed).
   Call `SceneObjectSchema.array().parse(SCENE_OBJECTS)`.
5. `digital.ts` — export `DIGITAL_RECORDS`: 5 evidence-yielding records
   (`DR-telco`, `DR-photo`, `DR-profile`, `DR-voicemail`, `DR-email`) plus
   10 texture records with no `yieldsEvidence`. All `deleted: false` except
   `DR-voicemail` and `DR-email` which have `deleted: true`.
   Call `DigitalRecordSchema.array().parse(DIGITAL_RECORDS)`.

**Done when:**
- AC-05-1 (partial — these five files), AC-05-2, AC-05-3 pass.
- `npm run typecheck` is clean on all five files.

---

## Task 1.8 — Case 001 data files (witnesses, contradictions, links,
entity rules, index)

**Files touched:** `src/data/case001/witnesses.ts`,
`src/data/case001/contradictions.ts`, `src/data/case001/links.ts`,
`src/data/case001/entity-rules.ts`, `src/data/case001/index.ts`

**Steps:**
1. `witnesses.ts` — export `WITNESSES`: array of 3 `Witness` objects
   (`margaret`, `dorothea`, `julian`), each with the full `facts` array and
   `fallbackLines` for all four situations, matching §9.7 exactly.
   Call `WitnessSchema.array().parse(WITNESSES)`.
2. `contradictions.ts` — export `CONTRADICTION_RULES`: array of 7
   `ContradictionRule` objects (`CX-01`–`CX-07`), matching §9.8.
   Call `ContradictionRuleSchema.array().parse(CONTRADICTION_RULES)`.
3. `links.ts` — export `LINK_RULES`: array of 13 `LinkRule` objects
   from §9.9. Call `LinkRuleSchema.array().parse(LINK_RULES)`.
4. `entity-rules.ts` — export `ENTITY_RULES`: array of 8 `EntityRule`
   objects (`ER-01`–`ER-08`, including `ER-06b`), matching §9.10.
   Call `EntityRuleSchema.array().parse(ENTITY_RULES)`.
5. `index.ts` — import all arrays, assemble and export `CASE_001` and
   `type Case001`.

**Done when:**
- AC-05-1 (all files), AC-05-2, AC-05-3, AC-05-4 pass.
- `npm run typecheck` is clean across all case data files.

---

## Task 1.9 — Case validation script

**Files touched:** `scripts/validate-case.ts`

**Steps:**
1. Import `CASE_001` from `@/data/case001/index`.
2. Build lookup sets from the imported data.
3. Run all checks from design §6.2.
4. Collect failures (do not short-circuit on first error).
5. Print `✓ Case 001 validation passed` and exit 0, or print each broken
   reference and exit 1.

**Done when:**
- AC-06-1 through AC-06-5 pass.
- `npm run validate:case` exits 0 on clean data.
- Temporarily changing `"EV-07"` to `"EV-99"` in `scene.ts` causes it to
  exit 1 and name the broken reference; revert afterwards.

---

## Task 1.10 — Zustand store, persistence and hydration guard

**Files touched:** `src/store/gameStore.ts`, `src/store/migrations.ts`,
`src/store/selectors.ts`, `src/store/useHydrated.ts`,
`src/app/layout.tsx` (add hydration guard)

**Steps:**
1. `gameStore.ts`:
   - Define initial state matching `GameStateSchema` with `version: 1`.
   - Define all actions from design §7.1.
   - Wrap with Zustand `persist` middleware, key `haunting-save-v1`,
     `localStorage` storage.
   - On rehydration, call the migration function; if it returns a reset state,
     apply it.
2. `migrations.ts` — export `migrateState(stored: unknown): GameState | null`.
   If `stored.version !== 1`, return `null` (triggers reset).
3. `selectors.ts` — implement the four selectors from design §7.4.
   Each is a pure function: `(state: GameState, caseData?: Case001) => T`.
4. `useHydrated.ts` — a small React hook that returns `false` until
   `useGameStore.persist.onFinishHydration` fires, then `true`.
5. In `src/app/layout.tsx`, wrap `{children}` with a `<HydrationGuard>`
   component (defined inline or in `src/components/ui/`) that renders a
   neutral dark screen (`bg-obsidian`) until `useHydrated()` is true.

**Done when:**
- AC-07-1 through AC-07-7 pass.
- Vitest tests for persistence and version-mismatch pass.
- No hydration mismatch warnings in the browser console.

---

## Task 1.11 — Store persistence tests

**Files touched:** `tests/unit/store-persistence.test.ts`

**Steps:**
1. Mock `localStorage` with a simple in-memory implementation.
2. **Test A — round-trip persistence:**
   - Dispatch `startInvestigation('Test')`, `collectEvidence('EV-01')`,
     `setTrust('margaret', 55)`.
   - Serialize the store state (as the persist middleware would).
   - Deserialize into a fresh store instance.
   - Assert: `collectedEvidence` contains `EV-01`; `witnessTrust.margaret`
     is 55; `investigator.name` is `'Test'`.
3. **Test B — version mismatch:**
   - Write a stored object with `version: 0` to the mock localStorage.
   - Hydrate a fresh store.
   - Assert: store returns initial state (empty `collectedEvidence`, no
     investigator name); no error thrown.

**Done when:**
- AC-07-6 and AC-07-7 pass.
- `npm run test` is green.

---

## Task 1.12 — Title screen

**Files touched:** `src/app/page.tsx`,
`src/components/ui/HydrationGuard.tsx` (extract if not already done in 1.10)

**Steps:**
1. `src/app/page.tsx` — Client Component.
   - Wait for hydration before rendering content.
   - Five-layer layout as described in design §8.1.
   - Next.js `<Image>` for mansion background, `fill`, `priority`.
     Provide a solid `--obsidian` background colour so the page is not blank
     if the image is missing.
   - CSS `@keyframes drift` for mist layer; wrap in
     `@media (prefers-reduced-motion: no-preference)`.
   - Save-detection logic from design §8.2.
   - "New Investigation" `Modal` from design §8.2.
   - Mute toggle fixed bottom-right using `lucide-react`'s `Volume2` /
     `VolumeX` icon.
   - Navigation via `useRouter().push('/hq')`.

**Done when:**
- AC-08-1 through AC-08-10 pass.
- Renders correctly with no mansion image (placeholder background visible).
- Renders correctly when a save exists (Continue + New Investigation link).
- Renders correctly on a fresh store (Begin Investigation only).

---

## Task 1.13 — Investigation HQ

**Files touched:** `src/app/hq/page.tsx`,
`src/components/archive/TopBar.tsx`,
`src/components/archive/NotificationTray.tsx`

**Steps:**
1. `TopBar.tsx` — layout from design §9.2.
   Active route detection via `usePathname()`.
2. `NotificationTray.tsx` — renders entity messages as small
   `ParchmentCard` items; hidden when `entity.messages` is empty.
3. `src/app/hq/page.tsx` — Client Component.
   - Three-region layout from design §9.1.
   - `CaseFolder` with props derived from store + `CASE_TRUTH`.
   - House photo in `ArchiveFrame` with Next.js `<Image>`; graceful missing
     asset handling as in Task 1.12.
   - Key Evidence panel from design §9.4.
   - Stats grid from design §9.5.
   - Continue button from design §9.6.
   - Candle SVG with flicker animation from design §9.7.
   - Locked "COMING SOON" future-case card (a `ParchmentCard` with a
     `lucide-react` `Lock` icon and greyed text).

**Done when:**
- AC-09-1 through AC-09-11 pass.
- Fresh-state renders without crash (all empty states shown).
- After collecting evidence in a test session, Key Evidence panel shows the
  correct names.

---

## Task 1.14 — token-check script

**Files touched:** `scripts/token-check.ts`,
`package.json` (add `"token-check": "tsx scripts/token-check.ts"` script)

**Steps:**
1. Script accepts an optional glob argument; defaults to
   `src/components/**/*.tsx`.
2. Reads each matched file and checks for:
   - Hex literals: `/#[0-9a-fA-F]{3,8}\b/`
   - Bare font strings (not via CSS variable): `fontFamily.*['"]\w`
   - Entity token usage outside `components/entity/`:
     strings `--entity` or `--entity-glow`
3. Prints offending file + line number.
4. Exits 1 if any violations found, 0 otherwise.

**Done when:**
- AC-02-6 passes.
- Running the script on the current clean component tree exits 0.
- Temporarily adding `color: '#8F1D2C'` to any non-entity component causes
  it to exit 1; revert afterwards.

---

## Post-spec checklist

After all 14 tasks are complete and passing:

- [ ] `npm run dev` — title screen visible, HQ navigable, no console errors
- [ ] `npm run build` — clean, no type errors
- [ ] `npm run typecheck` — exits 0
- [ ] `npm run lint` — exits 0
- [ ] `npm run test` — all tests green
- [ ] `npm run validate:case` — exits 0
- [ ] `npm run token-check` — exits 0
- [ ] `/gallery` renders in dev; returns 404 in production build
- [ ] Browser: refresh on `/hq` after collecting evidence keeps state
- [ ] Browser: no hydration mismatch warnings in console
- [ ] Git: commit with message `feat: Spec 01 foundation complete`
