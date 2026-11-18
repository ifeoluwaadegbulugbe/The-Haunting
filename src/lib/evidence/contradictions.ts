import type { GameState, ContradictionRule } from '@/types'
import type { Case001 } from '@/data/case001'

/**
 * Returns contradictions where the player holds both sides.
 * A side is "held" if it's a collected evidence ID or a revealed statement ID.
 */
export function getAvailableContradictions(
  state: GameState,
  caseData: Case001
): ContradictionRule[] {
  const collected  = new Set(Object.keys(state.collectedEvidence))
  const statements = new Set(getRevealedStatementIds(state, caseData))

  const held = (id: string) => collected.has(id) || statements.has(id)
  return caseData.contradictions.filter((cx) => held(cx.a) && held(cx.b))
}

/**
 * Returns contradictions the player has explicitly confirmed via flagContradiction.
 */
export function getConfirmedContradictions(
  state: GameState,
  caseData: Case001
): ContradictionRule[] {
  return caseData.contradictions.filter((cx) =>
    state.contradictionsFlagged.includes(cx.id)
  )
}

/**
 * Maps revealed fact IDs to their statement IDs.
 */
function getRevealedStatementIds(state: GameState, caseData: Case001): string[] {
  const ids: string[] = []
  for (const witness of caseData.witnesses) {
    for (const fact of witness.facts) {
      if (fact.yieldsStatementId && state.revealedFacts.includes(fact.id)) {
        ids.push(fact.yieldsStatementId)
      }
    }
  }
  return ids
}
