# Spec 04 — Evidence and Conclusion: Requirements

## Scope

Evidence board (draggable cards, SVG threads, contradiction flow), timeline tab,
theory form, deterministic scoring engine, the reveal sequence, and the final
report card. This completes the core investigation loop.

---

## US-25 · Contradiction detection and confirmation

**As a player,** I want to flag pairs of evidence/statements as contradictions,
so that confirmed contradictions count toward my score and unlock sections.

- AC-25-1: `src/lib/evidence/contradictions.ts` exports
  `getAvailableContradictions(state, caseData)` → `ContradictionRule[]`
  — pairs where the player holds both sides.
- AC-25-2: `getConfirmedContradictions(state, caseData)` → `ContradictionRule[]`
  — pairs the player has explicitly flagged via `flagContradiction`.
- AC-25-3: Confirming a contradiction never calls the AI.
- AC-25-4: When a contradiction is confirmed, `addAttention(10)` is called and
  entity rules are evaluated for `contradictionConfirmed` events.
- AC-25-5: Vitest tests: available only when both sides held; confirmed only
  after explicit flag; CX-07 confirmation triggers ER-07 (attentionDelta -30).

---

## US-26 · Timeline validation

**As a developer,** I want pure functions that check timeline placement for
structural conflicts, so the player gets instant feedback without revealing the
correct answer.

- AC-26-1: `src/lib/evidence/timeline.ts` exports `validateTimelinePlacement(
  placement, caseData)` → `Array<{ slot: string; conflict: string }>`.
- AC-26-2: A structural conflict occurs when an event is placed before another
  event that it `requires` (per `TimelineEvent.requires`).
- AC-26-3: The canonical order is NOT revealed until theory submission.
- AC-26-4: Vitest tests: canonical order produces zero conflicts; placing TL-05
  before TL-04 produces a conflict.

---

## US-27 · Evidence board screen

**As a player,** I want a cork board where I can drag evidence cards and draw
string connections between them, so that building my theory feels physical.

- AC-27-1: `/case/001/evidence` renders the Evidence Board.
- AC-27-2: Three tabs: **Connections** (default), **Timeline**, **Theories**.
- AC-27-3: **Connections tab**: evidence cards absolutely positioned on a
  cork/parchment background (`board-wall.jpg`). Cards are draggable via
  pointer events. Positions saved to `boardPositions` in the store.
- AC-27-4: Dragging from one card's pin to another creates a thread. The thread
  is an SVG `<path>` with a slight sag (quadratic bezier). Valid links show
  `--thread` colour; contradictions show a zigzag mark; invalid links fade
  with "Not conclusive" text.
- AC-27-5: The 11:13 anchor card is fixed at the centre (cannot be dragged).
- AC-27-6: `evaluateLink(a, b, caseData)` determines the verdict. `addLink` is
  called on the store. Valid links call `addAttention(5)` and trigger entity
  rules for `linksReached`.
- AC-27-7: Contradiction links open a `ContradictionBadge` and call
  `flagContradiction`. Entity rules for `contradictionConfirmed` are evaluated.
- AC-27-8: **Timeline tab**: seven slots (time labels). Player drags event cards
  into slots. Structural conflicts are highlighted. Calls `placeTimelineEvent`.
- AC-27-9: **Theories tab**: the theory form (US-28).
- AC-27-10: Calls `setLastRoute` on mount.

---

## US-28 · Theory form and Submit button

**As a player,** I want a structured theory form where I can record my
conclusions before submitting, so that my theory is captured in the right format
for scoring.

- AC-28-1: Theory form fields match `TheorySchema`: culprit select, what
  happened select (4 options), why calls continue select (4 options), witness
  reliability per witness, manipulated evidence select, supporting evidence
  pickers for 3 claims, optional summary textarea.
- AC-28-2: **Submit Theory** is disabled with a tooltip until: culprit set,
  what happened set, why calls continue set, all three witness reliability
  fields set, manipulated evidence set, and minimum evidence picked for each
  claim (3/3/2).
- AC-28-3: On submit, `setTheory(theory)` is called, then the game navigates
  to `/case/001/conclusion`.
- AC-28-4: Before submitting, ER-06b fail-safe runs: if EV-X1 is not in
  `collectedEvidence`, `plantEvidence('EV-X1')` is called.

---

## US-29 · Scoring engine

**As a developer,** I want a pure scoring function that produces a 0–100 score
and per-category breakdown, so the final score is deterministic and testable.

- AC-29-1: `src/lib/scoring/score.ts` exports `scoreTheory(theory, state,
  caseData)` → `{ score: number; breakdown: Record<string, number>; rank: string }`.
- AC-29-2: Scoring matches §11.5 exactly:
  - Culprit (10) + what happened (15) = 25 pts
  - Timeline: 3 pts per correctly placed event for 6 events, 2 for the 7th = 20 pts
  - Evidence interpretation: culprit claim 8, timeline claim 8, cover-up 4 = 20 pts
  - Witness reliability: 5 per witness = 15 pts
  - Why calls continue = 10 pts
  - Manipulated evidence = 10 pts
  - Citing EV-X1 as supporting evidence subtracts 5 from that section (never below 0)
- AC-29-3: `selectRank(score)` maps to the correct rank title.
- AC-29-4: Vitest tests: golden path scores 100; wrong culprit loses 25; each
  wrong timeline slot costs the specified points; EV-X1 in supporting evidence
  subtracts 5.

---

## US-30 · Case Conclusion — reveal sequence

**As a player,** I want a cinematic reveal sequence that shows me the truth of
the case and my score, so that the investigation has a satisfying ending.

- AC-30-1: `/case/001/conclusion` has three phases: **Submission** (theory
  form review), **Reveal** (animated sequence), **Report card**.
- AC-30-2: Before the reveal begins, ER-06b is enforced (EV-X1 planted if not
  already present).
- AC-30-3: The reveal sequence: fade to black → rain/candle → theory note
  appears typed → phone rings → player clicks **Answer** → Clara's voicemail
  plays (authored text from `truth.ts`) → cellar photograph fades in
  (`cellar-reveal.jpg`) → report card appears.
- AC-30-4: The score is computed by `scoreTheory` and stored via `setVerdict`.
- AC-30-5: Report card shows: score, rank, per-category feedback with correct
  answers, **Replay** and **Return to HQ** buttons.
- AC-30-6: After the reveal, HQ stamps the case SOLVED and the entity colours
  are retired from the interface.
- AC-30-7: The 11:13 overlay stops on the HQ page once a verdict is stored.
