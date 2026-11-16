import type { GameState, ContradictionRule } from '@/types'
import type { Case001 } from '@/data/case001'

// ── Progress percentage ────────────────────────────────────────────────────
// §11.1: 0.40 evidence + 0.20 contradictions + 0.20 links + 0.10 facts + 0.10 timeline

export function selectProgress(state: GameState, caseData: Case001): number {
  const totalGenuineEvidence = caseData.evidence.filter(
    (e) => e.authenticity === 'genuine'
  ).length // 15 (EV-01..EV-15)

  const collectedGenuine = Object.keys(state.collectedEvidence).filter((id) => {
    const ev = caseData.evidence.find((e) => e.id === id)
    return ev && ev.authenticity === 'genuine'
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
