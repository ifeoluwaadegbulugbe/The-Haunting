# Spec 01 — Foundation: Requirements

## Scope

This spec covers everything needed before any game logic is built:
project scaffolding, the design token system, base UI components, the Zustand
store with persistence, the case data type system and validation script, and
the first two navigable screens (title and HQ).

Nothing in this spec touches the investigation engine, AI witnesses, the entity
or the evidence board. Those are Specs 02–04.

---

## User stories and acceptance criteria

---

### US-01 · Project scaffolding

**As a developer,** I want a Next.js project with all approved dependencies
installed and all tooling configured, so that I can run, build, typecheck, lint
and test the project from day one.

**Acceptance criteria:**

- AC-01-1: `npm run dev` starts the development server without errors.
- AC-01-2: `npm run build` produces a clean production build with no type
  errors.
- AC-01-3: `npm run typecheck` (`tsc --noEmit`) exits with code 0 on a clean
  tree.
- AC-01-4: `npm run lint` exits with code 0 on a clean tree.
- AC-01-5: `npm run test` runs Vitest and exits with code 0 (even with zero
  test files, the runner must not error).
- AC-01-6: `npm run validate:case` runs `scripts/validate-case.ts` via
  `ts-node` or `tsx` and exits with code 0 against the stub data files.
- AC-01-7: `.env.example` is present and `.env*` is in `.gitignore`.
- AC-01-8: `node_modules`, `.next`, and build artefacts are in `.gitignore`.
- AC-01-9: TypeScript is in strict mode (`"strict": true` in `tsconfig.json`).
- AC-01-10: Path aliases are configured so `@/` resolves to `src/`.
- AC-01-11: The folder structure matches `structure.md` exactly (empty
  directories may contain a `.gitkeep`).

---

### US-02 · Design tokens and global styles

**As a developer,** I want all colour, typography and spacing values defined as
CSS custom properties and Tailwind tokens, so that no component ever contains a
raw hex value or an arbitrary font name.

**Acceptance criteria:**

- AC-02-1: `src/styles/tokens.css` defines every token from the colour table in
  `design-system.md` as a CSS custom property (e.g. `--obsidian: #171419`).
- AC-02-2: `tailwind.config.ts` maps each token to a Tailwind colour name
  (e.g. `obsidian: 'var(--obsidian)'`) so they are usable as utility classes.
- AC-02-3: `src/styles/globals.css` imports `tokens.css`, sets the default
  background to `--obsidian` and the default text colour to `--parchment`.
- AC-02-4: All four fonts (Cinzel, Cormorant Garamond, Inter, Caveat) are
  loaded via `next/font/google` and exposed as CSS variables.
- AC-02-5: The `--haunt-level` custom property is defined with a default value
  of `0` on `:root`.
- AC-02-6: The `token-check` hook (run manually via lint or on file save)
  reports an error for any `.tsx` file that contains a raw hex colour, an
  `@import` for a font, or any reference to `--entity` or `--entity-glow`
  outside a file path matching `components/entity/**`.

---

### US-03 · Base UI components

**As a developer,** I want a library of base UI components built to the design
system specification, so that every screen is assembled from the same parts and
visual consistency is automatic.

**Acceptance criteria:**

- AC-03-1: The following components exist and are exported from
  `src/components/ui/`:
  `Button`, `Modal`, `Toast`, `ProgressBar`, `Stamp`, `WaxSeal`,
  `ParchmentCard`, `ArchiveFrame`, `CaseFolder`.
- AC-03-2: `Button` supports variants `primary`, `secondary` and `ghost`; and
  states `default`, `hover`, `focus`, `pressed`, `disabled` and `loading`.
  - Disabled state renders with lowered opacity and accepts a `tooltip` prop
    that is shown on hover.
  - Loading state renders a small candle-flame SVG spinner.
  - Focus state shows a visible 2 px gold ring (passes WCAG 2.4.7).
- AC-03-3: `ProgressBar` accepts a `value` (0–100) and renders a filled bar
  using `--gold` with a `--burgundy` track.
- AC-03-4: `Stamp` renders an SVG text element rotated and styled to look like
  a rubber stamp. It accepts a `label` prop and a `variant` of
  `unresolved | solved`.
- AC-03-5: `ArchiveFrame` renders a panel with a 1 px `--gold` border and
  decorative corner SVG marks.
- AC-03-6: `ParchmentCard` renders a card surface in `--parchment-dark` with
  a 2 px border radius and warm shadow.
- AC-03-7: A component gallery page at `/gallery` (dev-only, excluded from
  production build) renders every component in every state against the dark
  background, so the full design system can be reviewed visually.
- AC-03-8: Every interactive component has an `aria-label` or visible label and
  meets a 4.5:1 contrast ratio against its background.
- AC-03-9: All animation in components honours `prefers-reduced-motion` by
  replacing motion with an instant style change.

---

### US-04 · Case data types and Zod schemas

**As a developer,** I want all game data shapes defined as Zod schemas (the
single source of truth), with TypeScript types inferred from them, so that any
data error is caught at build time rather than at runtime.

**Acceptance criteria:**

- AC-04-1: `src/types/index.ts` exports Zod schemas and inferred types for:
  `Evidence`, `SceneObject`, `DigitalRecord`, `Condition`, `WitnessFact`,
  `Witness`, `TimelineEvent`, `ContradictionRule`, `LinkRule`, `EntityRule`,
  `Theory`, `GameState`.
- AC-04-2: Every field shape matches the data models in Section 8 of the master
  brief exactly (field names, types, optionality).
- AC-04-3: `Authenticity`, `Reliability`, `EvidenceKind` are defined as Zod
  enums and inferred union types.
- AC-04-4: The `Condition` type supports `allOf` and `anyOf` arrays of
  condition checks (`hasEvidence`, `hasFact`, `hasContradiction`,
  `presentedEvidence`, `stageAtLeast`).
- AC-04-5: No type in `src/types/index.ts` is written by hand with
  `interface` or `type` — all are inferred via `z.infer<>`.
  (Exception: re-export aliases for readability are permitted.)

---

### US-05 · Case 001 data files

**As a developer,** I want all Case 001 data authored as typed TypeScript
constants in `src/data/case001/`, so that the case is a single source of
truth that any module can import and that the validation script can verify.

**Acceptance criteria:**

- AC-05-1: The following files exist and export the described constants:
  - `truth.ts` — `CASE_TRUTH` (canonical narrative strings, never touched by AI)
  - `timeline.ts` — `TIMELINE_EVENTS`: all seven `TimelineEvent` objects with
    IDs `TL-01` through `TL-07`
  - `evidence.ts` — `EVIDENCE_ITEMS`: all sixteen `Evidence` objects with IDs
    `EV-01` through `EV-15` and `EV-X1`
  - `scene.ts` — `SCENE_OBJECTS`: all nine `SceneObject` objects with IDs
    `OBJ-telephone` through `OBJ-rug`
  - `digital.ts` — `DIGITAL_RECORDS`: the five evidence-yielding `DigitalRecord`
    objects (`DR-telco`, `DR-photo`, `DR-profile`, `DR-voicemail`, `DR-email`)
    plus 8–10 texture records with no `yieldsEvidence`
  - `witnesses.ts` — `WITNESSES`: all three `Witness` objects
    (`julian`, `margaret`, `dorothea`) with their complete `WitnessFact` arrays
  - `contradictions.ts` — `CONTRADICTION_RULES`: all seven `ContradictionRule`
    objects (`CX-01` through `CX-07`)
  - `links.ts` — `LINK_RULES`: all thirteen `LinkRule` objects from §9.9
  - `entity-rules.ts` — `ENTITY_RULES`: all eight `EntityRule` objects
    (`ER-01` through `ER-08`, including `ER-06b`)
  - `index.ts` — re-exports all of the above and assembles a single `CASE_001`
    object combining them
- AC-05-2: Every ID listed in Sections 9.2–9.10 of the master brief exists in
  the data files with the exact string shown (e.g. `"EV-07"`, `"OBJ-clock"`,
  `"CX-03"`, `"TL-05"`).
- AC-05-3: Every data object passes its Zod schema's `parse()` call at module
  load time (wrap each array in `z.array(schema).parse(...)` in the file).
- AC-05-4: Cross-references are consistent: every `yieldsEvidence` ID in
  `scene.ts` and `digital.ts` refers to an ID that exists in `evidence.ts`;
  every contradiction side (`a`, `b`) refers to an ID in `evidence.ts` or a
  statement ID (`ST-*`) that exists in a `WitnessFact`; every link pair refers
  to IDs in `evidence.ts`.

---

### US-06 · Case validation script

**As a developer,** I want a script that checks referential integrity across all
case data files, so that a typo in any ID is caught before it reaches the
running game.

**Acceptance criteria:**

- AC-06-1: `scripts/validate-case.ts` runs via `npm run validate:case` using
  `tsx` (no compilation step required).
- AC-06-2: The script loads all case data, then checks:
  - Every `yieldsEvidence` ID in `scene.ts` and `digital.ts` resolves to an
    entry in `evidence.ts`.
  - Every contradiction side (`a`, `b`) resolves to an evidence ID or a
    statement ID (`ST-*`) present in a `WitnessFact.yieldsStatementId`.
  - Every link pair (`a`, `b`) resolves to evidence IDs.
  - Every `EntityRule.targetRef` (if present) resolves to an evidence or scene
    object ID.
  - Every `TimelineEvent` referenced in an `Evidence.relatedEvents` array
    resolves to a `TL-*` ID.
- AC-06-3: On success, the script prints `✓ Case 001 validation passed` and
  exits with code 0.
- AC-06-4: On failure, the script prints every broken reference with the file
  and field that contains it, and exits with code 1.
- AC-06-5: Intentionally breaking one reference (e.g. changing `"EV-07"` to
  `"EV-99"` in `scene.ts`) causes the script to exit with code 1 and name the
  broken reference.

---

### US-07 · Zustand store with persistence

**As a player,** I want my investigation progress saved automatically, so that
refreshing the page or closing the tab never loses what I have discovered.

**Acceptance criteria:**

- AC-07-1: `src/store/gameStore.ts` defines a Zustand store whose shape exactly
  matches the `GameState` interface in Section 8.2, validated by the Zod schema
  from US-04.
- AC-07-2: The store uses Zustand's `persist` middleware with the key
  `haunting-save-v1` and `localStorage` as the storage.
- AC-07-3: A `version` field in `GameState` is set to `1` for this spec.
  `src/store/migrations.ts` exports a function that is called on hydration: if
  the stored version differs from the current version, it clears the store and
  returns the initial state (never crashes).
- AC-07-4: All pages render a neutral loading frame (e.g. a dark screen with
  the crest) until the store has hydrated, so server and client markup match and
  there is no hydration mismatch error in the console.
- AC-07-5: `src/store/selectors.ts` exports pure selector functions (no
  side-effects, no network calls):
  - `selectProgress(state, caseData)` → number 0–100 using the formula in
    §11.1
  - `selectRank(score)` → rank string using the table in §11.5
  - `selectUnlockedSections(state)` → `{ scene, archive, witnesses,
    conclusion }` booleans using the rules in §11.2
  - `selectAvailableContradictions(state, caseData)` → array of
    `ContradictionRule` IDs where both sides are held
- AC-07-6: A Vitest test proves that after simulating a page refresh (serialize
  → deserialize the store), all collected evidence IDs, confirmed contradictions
  and witness trust values are identical to before the refresh.
- AC-07-7: A Vitest test proves that a version mismatch results in the initial
  state being returned, not a crash.

---

### US-08 · Title screen

**As a player,** I want to see an atmospheric title screen when I first visit
the site, so that the game's tone is established immediately and I can start
or continue my investigation.

**Acceptance criteria:**

- AC-08-1: The route `/` renders the title screen.
- AC-08-2: The screen shows the mansion illustration (`public/assets/ui/
  title-mansion.png`) as a full-bleed background.
- AC-08-3: The wordmark is centred on the lower half: small "THE" above a large
  "HAUNTING" in Cinzel, with a thin gold rule and the tagline
  "INVESTIGATE · UNCOVER · BE FOUND" below.
- AC-08-4: If no save exists in localStorage, the primary button reads
  **BEGIN INVESTIGATION** and navigates to `/hq` on click.
- AC-08-5: If a save exists, the primary button reads **CONTINUE INVESTIGATION**
  and a secondary text link reads **New Investigation**, which shows a
  confirmation `Modal` before clearing the store and starting fresh.
- AC-08-6: The button uses the `Button` component (`primary` variant) with the
  ornamental burgundy-to-crimson frame described in `design-system.md`.
- AC-08-7: A mute toggle sits in a fixed corner (bottom-right). It shows a
  speaker icon (from lucide-react) and toggles `ui.muted` in the store. It is
  present even before sound is wired up (P1).
- AC-08-8: Slow mist drift and a faint window-light flicker are implemented as
  CSS animations (not JavaScript). They are disabled when
  `prefers-reduced-motion: reduce` is set.
- AC-08-9: The screen is fully keyboard-navigable: Tab reaches the button and
  the mute toggle; Enter activates them.
- AC-08-10: The placeholder image path (`title-mansion.png`) is used even if the
  image file does not yet exist — the screen must not crash on a missing asset.

---

### US-09 · Investigation HQ

**As a player,** I want an Investigation HQ screen that shows me my current
case, my recent discoveries and my progress, so that I always know where I am
in the investigation and what to do next.

**Acceptance criteria:**

- AC-09-1: The route `/hq` renders the Investigation HQ.
- AC-09-2: A top navigation bar contains: the crest and "THE HAUNTING" wordmark
  (left); centre links for Cases, Evidence, Archive and Profile; right side
  shows investigator name and rank title (computed from the store via
  `selectRank` and the progress score).
- AC-09-3: The main area shows a `CaseFolder` component styled as a pinned
  parchment case file, tilted ~1°, with:
  - "CASE 001" and "THE HOUSE THAT CALLS BACK" as the title
  - A three-line teaser (static authored text)
  - A `Stamp` component with label "UNRESOLVED" (switches to "SOLVED" after the
    verdict is stored)
  - A `ProgressBar` showing the value from `selectProgress`
- AC-09-4: A framed house photograph (`public/assets/scene/study-scene.png`,
  or a placeholder if absent) sits to the right of the case file.
- AC-09-5: A "Key Evidence" side panel lists the names of collected evidence
  items (from `collectedEvidence` in the store), most recent first, up to 6
  items. If nothing has been collected, it shows the italic text
  "Nothing recovered yet" in Caveat font.
- AC-09-6: A primary **Continue Investigation** button (or **Begin
  Investigation** before first play) navigates to `ui.lastRoute` if set, or to
  `/case/001/scene` if not.
- AC-09-7: Investigator statistics are displayed: evidence found, contradictions
  flagged, witnesses questioned, time played. All values are derived from store
  state, not hard-coded.
- AC-09-8: A notification tray shows entity messages from
  `entity.messages` (empty state: hidden).
- AC-09-9: A locked card for a future case is shown with a "COMING SOON" label
  and a padlock icon.
- AC-09-10: Navigating to `/hq` without a save (fresh state) must not crash —
  all empty states render gracefully.
- AC-09-11: The HQ matches the concept board composition and uses only design
  system tokens (no raw hex, no arbitrary fonts).

---

### US-10 · .gitignore

**As a developer,** I want a `.gitignore` that prevents secrets, build artefacts
and local config from being committed, so that the public repository is clean
and the API key can never be accidentally pushed.

**Acceptance criteria:**

- AC-10-1: `.gitignore` exists at the repo root.
- AC-10-2: The following patterns are ignored: `.env*` (except `.env.example`),
  `node_modules/`, `.next/`, `out/`, `coverage/`, `.DS_Store`,
  `*.local`.
- AC-10-3: `.env.example` is **not** ignored (it must be committed).
- AC-10-4: `.kiro/` is **not** ignored (steering, specs and hooks must be
  committed for the submission).
