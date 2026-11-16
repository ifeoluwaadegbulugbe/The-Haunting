# Spec 02 — Investigation Engine: Requirements

## Scope

Scene Explorer (hotspots, object inspection, evidence collection), the
discovery and unlock engine (pure functions), and the Digital Archives (three
device tabs, ghosted deleted records, recovery). Everything in this spec is
deterministic — no AI calls.

---

## User stories and acceptance criteria

---

### US-11 · Discovery and unlock engine

**As a developer,** I want pure functions that evaluate `Condition` objects
against game state, so that every discovery gate, section unlock and archive
recovery condition is computed identically everywhere.

**Acceptance criteria:**

- AC-11-1: `src/lib/engine/conditions.ts` exports `evaluateCondition(condition,
  state)` → `boolean`. An empty condition `{}` returns `true`.
- AC-11-2: `hasEvidence` checks `state.collectedEvidence[ref]`.
- AC-11-3: `hasFact` checks `state.revealedFacts.includes(ref)`.
- AC-11-4: `hasContradiction` checks `state.contradictionsFlagged.includes(ref)`.
- AC-11-5: `presentedEvidence` checks `state.presentedEvidence[witnessId]`
  — because presented evidence is per-witness, `ref` encodes as
  `"witnessId:evidenceId"`. The function splits on `:` and checks the right
  witness bucket.
- AC-11-6: `stageAtLeast` checks `state.entity.stage >= ref`.
- AC-11-7: `allOf` requires every child to pass; `anyOf` requires at least one.
- AC-11-8: A Vitest test covers every condition type with passing and failing
  states, plus the empty-condition base case.

---

### US-12 · Scene Explorer screen

**As a player,** I want to explore the illustrated study and click glowing
hotspots to inspect objects, so that I can discover physical evidence.

**Acceptance criteria:**

- AC-12-1: The route `/case/001/scene` renders the Scene Explorer.
- AC-12-2: The scene background (`/assets/scene/study-scene.png`) fills the
  viewport. If the image is absent the background is `--obsidian`.
- AC-12-3: Nine `Hotspot` components are rendered, each positioned by its
  `hotspot.x` / `hotspot.y` percentage coordinates, absolutely over the image.
- AC-12-4: Hotspot visual states:
  - **Undiscovered** — gold pulse ring.
  - **Inspected** — dimmed (opacity 0.4), no pulse.
  - **Locked** — small padlock icon visible, ring faded.
  - **Entity-disturbed** — crimson flicker (uses `--entity-glow` via the
    entity component path, not a raw hex).
- AC-12-5: Clicking an unlocked hotspot opens the `ObjectPanel` for that
  object; clicking a locked one shows a small tooltip stating what is needed.
- AC-12-6: `ObjectPanel` displays object name, description, any
  `discoveryCondition` failure message, and an **Inspect** button.
- AC-12-7: Clicking **Inspect** runs:
  1. `discoverObject(id)` + `inspectObject(id)` on the store.
  2. `collectEvidence(evId)` for each ID in `yieldsEvidence`.
  3. `addAttention` for each collected item (+6 for core, +3 for supporting).
  4. Stamps the evidence name into the `EvidenceTray`.
- AC-12-8: After inspection the panel shows the finding text and the **Inspect**
  button changes to **Collected** (disabled).
- AC-12-9: The `EvidenceTray` at the bottom shows thumbnails of all collected
  evidence (name + kind icon). Clicking a thumbnail opens its detail view.
- AC-12-10: **Entity moment — ER-01**: on `OBJ-telephone` first inspection, the
  room dims, an overlay appears for ≤ 4 s (clock snaps to 11:13 text), then
  fades. The `fireRule('ER-01')` action is dispatched.
- AC-12-11: Tab moves focus through hotspots; Enter activates; Escape closes
  the panel. Every hotspot has an `aria-label`.
- AC-12-12: Locked objects whose condition is not yet met show the padlock and
  the unmet condition as a tooltip/message — they never silently disable.
- AC-12-13: A **Back to HQ** link in the top-left returns to `/hq` and calls
  `setLastRoute('/case/001/scene')`.

---

### US-13 · Evidence collection engine

**As a developer,** I want pure functions that determine which evidence items
are collectable and validate evidence links, so that the board and scene share
the same logic.

**Acceptance criteria:**

- AC-13-1: `src/lib/evidence/collection.ts` exports
  `getCollectableObjects(state, caseData)` → `SceneObject[]` — the subset
  whose `discoveryCondition` passes.
- AC-13-2: `src/lib/evidence/links.ts` exports
  `evaluateLink(a, b, caseData)` → `'valid' | 'invalid' | 'contradiction'`
  by looking up the pair in `LINK_RULES` (order-insensitive).
- AC-13-3: `evaluateLink` returns `'contradiction'` for the EV-X1/EV-08 pair.
- AC-13-4: `evaluateLink` returns `'valid'` for every pair in §9.9.
- AC-13-5: `evaluateLink` returns `'invalid'` for a pair not in the table
  (e.g. EV-01/EV-03).
- AC-13-6: Vitest tests cover all three return values and the
  order-insensitive lookup.

---

### US-14 · Digital Archives screen

**As a player,** I want to browse recovered devices in a period-correct 2008
interface, so that I can find the digital evidence that unlocks the witnesses.

**Acceptance criteria:**

- AC-14-1: The route `/case/001/archive` renders the Digital Archives.
- AC-14-2: If the player does not hold both EV-01 and EV-07, the page shows a
  locked state: a `ParchmentCard` with a handwritten note explaining what is
  needed. No redirect — the page renders in place.
- AC-14-3: When unlocked, three device tabs are shown:
  **Edmund's Mobile**, **Clara's Laptop**, **Telephone Records**.
- AC-14-4: Each tab renders its records inside a `DeviceFrame` component that
  looks like a period-correct 2008 device (phone, laptop, ledger) inside an
  antique frame.
- AC-14-5: Records with `deleted: false` render normally.
- AC-14-6: Records with `deleted: true` render **ghosted** (opacity 0.35,
  italic label "DELETED") until their `recoveryCondition` is met.
- AC-14-7: When a record's `recoveryCondition` is met and the record has not
  been recovered, a **Recover** button appears. Clicking it calls
  `recoverRecord(id)`, `collectEvidence(yieldsEvidence)`, and `addAttention`.
- AC-14-8: Recovered records render at full opacity with a small
  "RECOVERED" stamp.
- AC-14-9: The archive section only appears in the navigation when
  `selectUnlockedSections(state).archive` is `true`.
- AC-14-10: `DeviceFrame` is a new component in
  `src/components/digital/DeviceFrame.tsx`.
- AC-14-11: Navigating to this page calls `setLastRoute('/case/001/archive')`.

---

### US-15 · Section lock UI

**As a player,** I want locked sections to show a clear explanation of what
I need to unlock them, so that I am never silently blocked.

**Acceptance criteria:**

- AC-15-1: Locked scene objects show a tooltip/inline message: e.g. "Requires:
  Rotary Telephone" rather than just being invisible or unclickable without
  explanation.
- AC-15-2: The Archive page locked state (AC-14-2) names the two required
  items explicitly.
- AC-15-3: The Witnesses page (stub) locked state names the required archive
  evidence count.
- AC-15-4: The Conclusion page (stub) locked state lists all three unlock
  conditions.
- AC-15-5: Locked section cards on HQ show the same handwritten-note style
  with the unlock requirement.

---

### US-16 · Progress and unlock selectors — engine tests

**As a developer,** I want unit tests for the progress formula and unlock
selectors, so that regressions in the core loop are caught immediately.

**Acceptance criteria:**

- AC-16-1: `selectProgress` with zero state returns 0.
- AC-16-2: `selectProgress` with all genuine evidence collected, all
  contradictions confirmed, all valid links made, all non-default facts
  revealed and all timeline slots filled returns 100.
- AC-16-3: `selectUnlockedSections` with neither EV-01 nor EV-07 returns
  `archive: false`.
- AC-16-4: `selectUnlockedSections` with both EV-01 and EV-07 returns
  `archive: true`.
- AC-16-5: `selectUnlockedSections` with fewer than 3 archive-evidence items
  returns `witnesses: false`.
- AC-16-6: `selectUnlockedSections` with 3+ archive-evidence items returns
  `witnesses: true`.
- AC-16-7: All tests in this file are pure — no React, no store subscription,
  no network calls.
