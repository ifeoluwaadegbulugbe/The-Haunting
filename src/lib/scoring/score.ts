import type { Theory, GameState } from '@/types'
import type { Case001 } from '@/data/case001'
import { selectRank } from '@/store/selectors'

export interface ScoringBreakdown {
  culpritAndWhatHappened: number  // max 25
  timeline: number  // max 20
  evidenceInterpretation: number  // max 20
  witnessReliability: number  // max 15
  whyCallsContinue: number  // max 10
  manipulatedEvidence: number  // max 10
}

export interface VerdictResult {
  score: number
  breakdown: ScoringBreakdown
  rank: string
}

// ── Correct answers (from §11.4) ──────────────────────────────────────────

const CORRECT_CULPRIT = 'Julian'
const CORRECT_WHAT_HAPPENED = 'Julian killed Edmund and locked Clara and Lily in the cellar'
const CORRECT_WHY_CALLS = "Clara's call for help was never answered"

const CORRECT_TIMELINE_ORDER = ['TL-01', 'TL-02', 'TL-03', 'TL-04', 'TL-05', 'TL-06', 'TL-07']

const CORRECT_WITNESS_RELIABILITY: Record<string, 'Honest' | 'Concealing' | 'Lying'> = {
  margaret: 'Concealing',
  dorothea: 'Lying',
  julian: 'Lying',
}

// Supporting evidence sets (any 3 of / any 2 of)
const CULPRIT_EVIDENCE_SET = new Set(['EV-05', 'EV-06', 'EV-07', 'EV-10', 'EV-14'])
const TIMELINE_EVIDENCE_SET = new Set(['EV-01', 'EV-07', 'EV-11', 'EV-12', 'EV-14'])
const COVERUP_EVIDENCE_SET = new Set(['EV-08', 'EV-13', 'EV-15'])

const MANIPULATED_EVIDENCE = 'EV-X1'

// ── Main scoring function ──────────────────────────────────────────────────

export function scoreTheory(
  theory: Theory,
  // Reserved for future state-dependent scoring; the current rules use only the theory.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  state: GameState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _caseData: Case001
): VerdictResult {
  const bd: ScoringBreakdown = {
    culpritAndWhatHappened: 0,
    timeline: 0,
    evidenceInterpretation: 0,
    witnessReliability: 0,
    whyCallsContinue: 0,
    manipulatedEvidence: 0,
  }

  // ── 1. Culprit (10) + what happened (15) ──────────────────────────────
  if (theory.culprit === CORRECT_CULPRIT) bd.culpritAndWhatHappened += 10
  if (theory.whatHappened === CORRECT_WHAT_HAPPENED) bd.culpritAndWhatHappened += 15

  // ── 2. Timeline (20) ──────────────────────────────────────────────────
  // Slots are keyed by index string; map them back to ordered event IDs
  const placedEvents = Object.entries(theory.timelinePlacement)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([, evId]) => evId)

  for (let i = 0; i < CORRECT_TIMELINE_ORDER.length; i++) {
    const correctId = CORRECT_TIMELINE_ORDER[i]
    const placedId = placedEvents[i]
    if (!placedId) continue
    if (placedId === correctId) {
      // Last event (index 6) is worth 2 pts, others 3 pts
      bd.timeline += i === 6 ? 2 : 3
    }
  }

  // ── 3. Evidence interpretation (20) ───────────────────────────────────
  const { culpritAndMotive, timeline: timelineEvidence, coverUp } =
    theory.supportingEvidence

  // Culprit claim: 8 pts if ≥3 correct items, deduct 5 for EV-X1
  let culpritScore = 0
  const culpritValid = culpritAndMotive.filter((id) => CULPRIT_EVIDENCE_SET.has(id)).length
  if (culpritValid >= 3) culpritScore = 8
  if (culpritAndMotive.includes(MANIPULATED_EVIDENCE)) {
    culpritScore = Math.max(0, culpritScore - 5)
  }
  bd.evidenceInterpretation += culpritScore

  // Timeline claim: 8 pts if ≥3 correct items, deduct 5 for EV-X1
  let tlScore = 0
  const tlValid = timelineEvidence.filter((id) => TIMELINE_EVIDENCE_SET.has(id)).length
  if (tlValid >= 3) tlScore = 8
  if (timelineEvidence.includes(MANIPULATED_EVIDENCE)) {
    tlScore = Math.max(0, tlScore - 5)
  }
  bd.evidenceInterpretation += tlScore

  // Cover-up claim: 4 pts if ≥2 correct items, deduct 5 for EV-X1 (floor 0)
  let cuScore = 0
  const cuValid = coverUp.filter((id) => COVERUP_EVIDENCE_SET.has(id)).length
  if (cuValid >= 2) cuScore = 4
  if (coverUp.includes(MANIPULATED_EVIDENCE)) {
    cuScore = Math.max(0, cuScore - 5)
  }
  bd.evidenceInterpretation += cuScore

  // ── 4. Witness reliability (15) ───────────────────────────────────────
  for (const [witnessId, correct] of Object.entries(CORRECT_WITNESS_RELIABILITY)) {
    if (theory.witnessReliability[witnessId] === correct) {
      bd.witnessReliability += 5
    }
  }

  // ── 5. Why calls continue (10) ────────────────────────────────────────
  if (theory.whyCallsContinue === CORRECT_WHY_CALLS) {
    bd.whyCallsContinue = 10
  }

  // ── 6. Manipulated evidence (10) ──────────────────────────────────────
  if (theory.manipulatedEvidence === MANIPULATED_EVIDENCE) {
    bd.manipulatedEvidence = 10
  }

  const score = Object.values(bd).reduce((a, b) => a + b, 0)
  const { title: rank } = selectRank(score)

  // Store breakdown as Record<string, number> for GameState compatibility
  return {
    score,
    breakdown: bd,
    rank,
  }
}
