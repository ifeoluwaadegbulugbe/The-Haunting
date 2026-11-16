# Spec 02 — Investigation Engine: Tasks

Each task ≤ 5 files. After every task: typecheck + test + validate:case.

Completion signal: player can inspect all nine scene objects in dependency
order, collect all physical evidence (EV-01–EV-10), navigate to Digital
Archives, recover all five archive evidence items (EV-11–EV-15), and refresh
without losing anything.

---

## Task 2.1 — Condition engine + evidence library (pure functions)

**Files:** `src/lib/engine/conditions.ts`, `src/lib/engine/index.ts`,
`src/lib/evidence/collection.ts`, `src/lib/evidence/links.ts`,
`src/lib/evidence/index.ts`

1. `conditions.ts` — implement `evaluateCondition` and `conditionMessage`
   per design §1.1 and §3.7.
2. `index.ts` — re-export both.
3. `collection.ts` — implement `getCollectableObjects`.
4. `links.ts` — implement `evaluateLink`.
5. `evidence/index.ts` — re-export both.

**Done when:** AC-11-1 through AC-11-7, AC-13-1 through AC-13-5 all described
behaviour is implemented and typechecks clean.

---

## Task 2.2 — Engine and evidence unit tests

**Files:** `tests/unit/conditions.test.ts`,
`tests/unit/evidence-links.test.ts`, `tests/unit/selectors.test.ts`

1. `conditions.test.ts` — test every condition type (pass + fail), `allOf`,
   `anyOf`, empty condition. AC-11-8.
2. `evidence-links.test.ts` — test `evaluateLink` for valid, invalid and
   contradiction pairs; order-insensitive. AC-13-6.
3. `selectors.test.ts` — test `selectProgress` (zero → 0, full → 100),
   `selectUnlockedSections` (archive and witnesses gates). AC-16-1 through
   AC-16-7.

**Done when:** `npm run test` is green with these three new files.

---

## Task 2.3 — Hotspot and EntityOverlay components

**Files:** `src/components/scene/Hotspot.tsx`,
`src/components/entity/EntityOverlay.tsx`,
`src/components/entity/DisturbedHotspot.tsx`,
`src/components/scene/index.ts`

1. `Hotspot.tsx` — per design §3.2. Four visual states. ARIA attributes.
2. `EntityOverlay.tsx` — full-screen takeover: `--ink` background at 85%,
   centred slot for text in Caveat, Framer Motion fade-in/out, max 4 s,
   always dismissible by click. Uses `--entity` / `--entity-glow` (entity
   directory, so token-check passes).
3. `DisturbedHotspot.tsx` — hotspot ring variant with crimson flicker;
   re-exported by scene components via a prop, keeping entity colours inside
   `components/entity/`.
4. `scene/index.ts` — export `Hotspot`.

**Done when:** token-check passes; components render in gallery (add a
`HotspotGallery` section to `/gallery`).

---

## Task 2.4 — ObjectPanel and EvidenceTray

**Files:** `src/components/scene/ObjectPanel.tsx`,
`src/components/scene/EvidenceTray.tsx`,
`src/components/scene/EvidenceDetailModal.tsx`

1. `ObjectPanel.tsx` — slides in from right (Framer Motion). Name,
   description, condition message if locked, Inspect / Collected button.
2. `EvidenceTray.tsx` — fixed bottom strip. Thumbnails from
   `collectedEvidence`. Overflow arrows. 44px touch targets.
3. `EvidenceDetailModal.tsx` — `Modal` wrapper showing full evidence detail.

**Done when:** panel opens/closes correctly; evidence names appear in tray
after collect.

---

## Task 2.5 — Scene Explorer page

**Files:** `src/app/case/001/scene/page.tsx`

1. Full-bleed image with absolute hotspot overlay.
2. Derives `HotspotState` for each object from store + `evaluateCondition`.
3. Handles object selection → `ObjectPanel`.
4. Handles **Inspect** → collect sequence (store actions + attention).
5. ER-01 entity moment on `OBJ-telephone`.
6. Calls `setLastRoute('/case/001/scene')` on mount.
7. Back to HQ link.

**Done when:** AC-12-1 through AC-12-13 pass. All nine objects reachable in
dependency order. EV-01–EV-10 collectable. ER-01 fires once.

---

## Task 2.6 — DeviceFrame and record renderers

**Files:** `src/components/digital/DeviceFrame.tsx`,
`src/components/digital/RecordWrapper.tsx`,
`src/components/digital/RecordRenderers.tsx`

1. `DeviceFrame.tsx` — three device styles per design §4.3.
2. `RecordWrapper.tsx` — ghosted / recover / recovered states per §4.5.
3. `RecordRenderers.tsx` — all seven kind renderers as named exports.

**Done when:** token-check passes; records render in correct state.

---

## Task 2.7 — Digital Archives page

**Files:** `src/app/case/001/archive/page.tsx`

1. Locked state (AC-14-2).
2. Three device tabs.
3. Each tab renders its `DigitalRecord` items via `RecordWrapper` +
   appropriate renderer.
4. Recover flow: `recoverRecord` + `collectEvidence` + `addAttention`.
5. Calls `setLastRoute('/case/001/archive')` on mount.

**Done when:** AC-14-1 through AC-14-11 pass. EV-11–EV-15 recoverable with
correct conditions.

---

## Task 2.8 — Stub pages for Witnesses, Evidence Board, Conclusion

**Files:** `src/app/case/001/witnesses/[id]/page.tsx`,
`src/app/case/001/evidence/page.tsx`,
`src/app/case/001/conclusion/page.tsx`

1. Each renders `TopBar` + centred `ParchmentCard`.
2. Witnesses and Conclusion check their unlock condition and show the
   appropriate locked message if not met.
3. Evidence Board is always accessible (always unlocked).
4. All three call `setLastRoute` on mount.

**Done when:** Navigation from HQ to all three pages works; locked states
show the correct requirement text.

---

## Task 2.9 — Wire TopBar navigation to unlock state

**Files:** `src/components/archive/TopBar.tsx`,
`src/app/hq/page.tsx`

1. Update `TopBar` to accept `unlockedSections` prop and grey out / add lock
   icon to Archive, Witnesses and Evidence links when their section is locked.
2. Update HQ page to pass `selectUnlockedSections(state)` to `TopBar`.

**Done when:** locked sections are visually indicated in the nav;
unlocking archive (by collecting EV-01 + EV-07) makes the Archive link active.

---

## Post-spec checklist

- [ ] `npm run test` — all tests green (conditions, links, selectors,
      persistence)
- [ ] `npm run typecheck` — clean
- [ ] `npm run validate:case` — passes
- [ ] `npm run token-check` — passes
- [ ] Manual: inspect OBJ-telephone → ER-01 fires, EV-01 collected
- [ ] Manual: inspect remaining objects in dependency order → EV-02–EV-10
      collected
- [ ] Manual: navigate to Archive → locked state shown before EV-07 collected
- [ ] Manual: collect EV-07 → Archive unlocks → EV-11–EV-15 recoverable
- [ ] Manual: refresh page → all collected evidence still present
- [ ] Git: `feat: Spec 02 investigation engine complete`
