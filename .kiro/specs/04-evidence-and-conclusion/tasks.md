# Spec 04 — Evidence and Conclusion: Tasks

---

## Task 4.1 — Contradiction and timeline pure functions + tests

**Files:** `src/lib/evidence/contradictions.ts`,
`src/lib/evidence/timeline.ts`,
`tests/unit/contradictions.test.ts`,
`tests/unit/timeline.test.ts`

1. `contradictions.ts` — `getAvailableContradictions`, `getConfirmedContradictions`.
2. `timeline.ts` — `validateTimelinePlacement`.
3. Tests for both. AC-25-1 to AC-25-4, AC-26-1 to AC-26-4.

**Done when:** tests green, typecheck clean.

---

## Task 4.2 — Scoring engine + tests

**Files:** `src/lib/scoring/score.ts`, `src/lib/scoring/index.ts`,
`tests/unit/scoring.test.ts`

1. Implement `scoreTheory` per §11.5.
2. Tests: golden path 100, wrong culprit -25, timeline errors, EV-X1 penalty.
   AC-29-1 to AC-29-4.

**Done when:** tests green.

---

## Task 4.3 — Evidence board components

**Files:** `src/components/board/EvidenceCard.tsx`,
`src/components/board/ThreadLayer.tsx`,
`src/components/board/ContradictionBadge.tsx`,
`src/components/board/TimelineSlot.tsx`

1. `EvidenceCard` — PolaroidCard style, drag via pointer events, pin dot.
2. `ThreadLayer` — SVG overlay, one `<path>` per link with sag.
3. `ContradictionBadge` — zigzag SVG mark, renders on contradiction links.
4. `TimelineSlot` — labelled drop zone.

**Done when:** token-check passes; cards draggable in isolation.

---

## Task 4.4 — Evidence board page (Connections + Timeline tabs)

**Files:** `src/app/case/001/evidence/page.tsx`

1. Replace stub with full board.
2. Connections tab: cork background, draggable cards, 11:13 anchor, thread
   drawing (drag from pin), link evaluation, entity dispatch on valid links.
3. Timeline tab: 7 slots, drag event cards, conflict highlighting.
4. `setLastRoute` on mount.

**Done when:** AC-27-1 to AC-27-10.

---

## Task 4.5 — Theory form + Submit

**Files:** `src/app/case/001/evidence/page.tsx` (Theories tab),
`src/components/board/TheoryForm.tsx`

1. All theory form fields.
2. Submit button gating.
3. ER-06b fail-safe on submit.
4. Navigate to `/case/001/conclusion` on submit.

**Done when:** AC-28-1 to AC-28-4.

---

## Task 4.6 — Conclusion page — reveal sequence + report card

**Files:** `src/app/case/001/conclusion/page.tsx`,
`src/components/conclusion/RevealSequence.tsx`,
`src/components/conclusion/ReportCard.tsx`

1. Three-phase state machine: submission → reveal → report.
2. Reveal sequence: fade, voicemail text, Answer button, cellar image.
3. `scoreTheory` called, `setVerdict` stored.
4. Report card: score, rank, per-category breakdown with correct answers.
5. ER-06b enforced on page load.

**Done when:** AC-30-1 to AC-30-7.

---

## Task 4.7 — Post-spec tests and polish

**Files:** `tests/unit/contradictions.test.ts` (entity dispatch),
`tests/unit/scoring.test.ts` (full golden path)

Ensure:
- CX-07 confirmation triggers ER-07 (attention -30).
- Golden path produces score 100.
- Build, typecheck, token-check all clean.

---

## Post-spec checklist

- [ ] `npm run test` — all tests green
- [ ] `npm run typecheck` — clean
- [ ] `npm run token-check` — clean
- [ ] `npm run build` — clean
- [ ] Manual: build a valid link on the board → thread appears
- [ ] Manual: flag CX-01 contradiction → entity message fires
- [ ] Manual: submit golden-path theory → score 100
- [ ] Manual: reveal sequence plays to completion
- [ ] Git: `feat: Spec 04 evidence and conclusion complete`
