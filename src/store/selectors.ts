import type { GameState, ContradictionRule } from '@/types'
import type { Case001 } from '@/data/case001'

// ── Progress percentage ────────────────────────────────────────────────────
// §11.1: 0.40 evidence + 0.20 contradictions + 0.20 links + 0.10 facts + 0.10 timeline

export function selectProgress(state: GameState, caseData: Case001): number {
  const totalGenuineEvidence = caseData.evidence.filter(
    (e) => e.authenticity === 'genuine' && e.relevance !== 'optional'
  ).length // 15 (EV-01..EV-15)

  const collectedGenuine = Object.keys(state.collectedEvidence).filter((id) => {
    const ev = caseData.evidence.find((e) => e.id === id)
    return ev && ev.authenticity === 'genuine' && ev.relevance !== 'optional'
  }).length

  const confirmedContradictions = state.contradictionsFlagged.length
  const totalContradictions = caseData.contradictions.length // 7

  const validLinks = state.links.filter((l) => l.verdict === 'valid').length
  const totalLinks = caseData.links.filter((l) => l.type !== 'contradicts').length // 12 valid + 1 contradicts = use 13

  // Non-default facts: facts whose revealWhen is not empty (not always-available)
  const allNonDefaultFacts = caseData.witnesses.flatMap((w) =>
    w.facts.filter((f) => {
      const rw = f.revealWhen
      return (rw.allOf && rw.allOf.length > 0) || (rw.anyOf && rw.anyOf.length > 0)
    })
  )
  const totalNonDefaultFacts = allNonDefaultFacts.length
  const revealedNonDefault = allNonDefaultFacts.filter((f) =>
    state.revealedFacts.includes(f.id)
  ).length

  const placedSlots = Object.keys(state.timelinePlacement).length
  const totalSlots = caseData.timeline.length // 7

  const evidence = totalGenuineEvidence > 0 ? collectedGenuine / totalGenuineEvidence : 0
  const contradictions = totalContradictions > 0 ? confirmedContradictions / totalContradictions : 0
  const links = totalLinks > 0 ? validLinks / totalLinks : 0
  const facts = totalNonDefaultFacts > 0 ? revealedNonDefault / totalNonDefaultFacts : 0
  const timeline = totalSlots > 0 ? placedSlots / totalSlots : 0

  const raw = 100 * (0.4 * evidence + 0.2 * contradictions + 0.2 * links + 0.1 * facts + 0.1 * timeline)
  return Math.min(100, Math.max(0, Math.round(raw)))
}

// ── Rank ───────────────────────────────────────────────────────────────────
// §11.5

export function selectRank(score: number): { rank: number; title: string } {
  if (score >= 95) return { rank: 5, title: 'Master of the Archive' }
  if (score >= 80) return { rank: 4, title: 'Inspector of the Unseen' }
  if (score >= 60) return { rank: 3, title: 'Senior Investigator' }
  if (score >= 40) return { rank: 2, title: 'Field Investigator' }
  return { rank: 1, title: 'Apprentice' }
}

// ── Unlocked sections ─────────────────────────────────────────────────────
// §11.2

export function selectUnlockedSections(
  state: GameState
): { scene: boolean; archive: boolean; witnesses: boolean; conclusion: boolean } {
  const collected = new Set(Object.keys(state.collectedEvidence))

  const archive = collected.has('EV-01') && collected.has('EV-07')

  const archiveEvidenceIds = ['EV-11', 'EV-12', 'EV-13', 'EV-14', 'EV-15']
  const archiveCollectedCount = archiveEvidenceIds.filter((id) => collected.has(id)).length
  const witnesses = archiveCollectedCount >= 3

  // Non-default facts count
  const revealedNonDefaultCount = state.revealedFacts.filter((id) =>
    // Any fact that isn't one of the always-available ones
    !['M1', 'M2', 'D1', 'J1'].includes(id)
  ).length

  const conclusion =
    Object.keys(state.collectedEvidence).length >= 10 &&
    state.contradictionsFlagged.length >= 3 &&
    revealedNonDefaultCount >= 6

  return { scene: true, archive, witnesses, conclusion }
}

// ── Available contradictions ───────────────────────────────────────────────
// A contradiction is available when the player holds both sides.

export function selectAvailableContradictions(
  state: GameState,
  caseData: Case001
): ContradictionRule[] {
  const collected = new Set(Object.keys(state.collectedEvidence))

  // Build the set of statement IDs the player has unlocked (via revealedFacts)
  const statementIds = new Set<string>()
  for (const witness of caseData.witnesses) {
    for (const fact of witness.facts) {
      if (fact.yieldsStatementId && state.revealedFacts.includes(fact.id)) {
        statementIds.add(fact.yieldsStatementId)
      }
    }
  }

  const held = (id: string) => collected.has(id) || statementIds.has(id)

  return caseData.contradictions.filter((cx) => held(cx.a) && held(cx.b))
}

// ── Next lead ──────────────────────────────────────────────────────────────
// What the player should do next, worked out from game state alone.

export type CaseSection = 'scene' | 'archive' | 'witnesses' | 'evidence' | 'conclusion'

export interface NextStep {
  section: CaseSection
  href: string
  title: string
  text: string
  action: string
}

const NON_DEFAULT_FACTS_NEEDED = 6
const CONTRADICTIONS_NEEDED = 3

export function selectNextStep(state: GameState, caseData: Case001): NextStep | null {
  if (state.verdict) return null
  const collected = new Set(Object.keys(state.collectedEvidence))
  const has = (id: string) => collected.has(id)

  const sceneEvidence = caseData.scene.flatMap((o) => o.yieldsEvidence)
  const sceneLeft = sceneEvidence.filter((id) => !has(id)).length
  const unlocked = selectUnlockedSections(state)

  if (!unlocked.archive || sceneLeft > 0) {
    const remaining = caseData.scene
      .filter((o) => !state.inspectedObjects.includes(o.id) || o.yieldsEvidence.some((id) => !has(id)))
      .map((o) => o.name)
    return {
      section: 'scene', href: '/case/001/scene', action: 'Search the study',
      title: 'The study is not finished with you',
      text: `${sceneLeft} item${sceneLeft === 1 ? '' : 's'} still hidden in the study. Still to search: ${remaining.join(', ')}. A padlocked ring opens once you hold the item it needs.`,
    }
  }

  const archiveEvidence = caseData.digital.flatMap((r) => (r.yieldsEvidence ? [r.yieldsEvidence] : []))
  const archiveLeft = archiveEvidence.filter((id) => !has(id)).length
  if (archiveLeft > 0) {
    return {
      section: 'archive', href: '/case/001/archive', action: 'Open the Digital Archives',
      title: 'The study is searched',
      text: `The family's phone records, laptop and mobile were recovered. ${archiveLeft} record${archiveLeft === 1 ? '' : 's'} there still hold${archiveLeft === 1 ? 's' : ''} evidence. Log them.`,
    }
  }

  const facts = state.revealedFacts.filter((id) => !['M1', 'M2', 'D1', 'J1'].includes(id)).length
  if (facts < NON_DEFAULT_FACTS_NEEDED) {
    return {
      section: 'witnesses', href: '/case/001/witnesses/margaret', action: 'Question the witnesses',
      title: 'Someone is not telling the truth',
      text: `Interview Margaret, Dorothea and Julian. When a story does not fit, present the evidence that breaks it. New statements: ${facts} of ${NON_DEFAULT_FACTS_NEEDED}.`,
    }
  }

  const flagged = state.contradictionsFlagged.length
  if (flagged < CONTRADICTIONS_NEEDED) {
    return {
      section: 'evidence', href: '/case/001/evidence', action: 'Open the evidence board',
      title: 'The stories do not agree',
      text: `On the evidence board, the Contradictions panel lists statements and evidence that cannot both be true. Confirm them. Flagged: ${flagged} of ${CONTRADICTIONS_NEEDED}.`,
    }
  }

  return {
    section: 'conclusion', href: '/case/001/conclusion', action: 'Go to the Conclusion',
    title: 'You know enough to name them',
    text: 'Connect evidence with red string and set the timeline in order on the board, then submit your theory in the Conclusion.',
  }
}
