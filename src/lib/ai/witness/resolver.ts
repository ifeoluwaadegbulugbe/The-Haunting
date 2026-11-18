import { evaluateCondition } from '@/lib/engine/conditions'
import type { Witness, WitnessFact, GameState } from '@/types'
import type { Case001 } from '@/data/case001'

export interface ResolverInput {
  witnessId: string
  presentedEvidenceId?: string
  snapshot: {
    collectedEvidenceIds: string[]
    revealedFactIds: string[]
    trust: number
    recentTurns: Array<{ role: 'player' | 'witness'; text: string }>
  }
}

export interface ResolverOutput {
  allowedFacts: WitnessFact[]
  lockedFacts: WitnessFact[]
  activeLieLines: string[]
  trustDelta: number
  revealGuarantee: WitnessFact[]
}

/**
 * Builds a minimal GameState-compatible snapshot for condition evaluation.
 * We only need the fields that evaluateCondition touches.
 */
function snapshotToState(
  input: ResolverInput
): Pick<GameState, 'collectedEvidence' | 'revealedFacts' | 'contradictionsFlagged' | 'presentedEvidence' | 'entity'> {
  const { snapshot, witnessId, presentedEvidenceId } = input

  // Build collectedEvidence map
  const collectedEvidence: GameState['collectedEvidence'] = {}
  for (const id of snapshot.collectedEvidenceIds) {
    collectedEvidence[id] = { at: 0, flags: [] }
  }

  // Add presentedEvidence to the witness bucket
  const presentedEvidence: GameState['presentedEvidence'] = {}
  if (presentedEvidenceId) {
    presentedEvidence[witnessId] = [presentedEvidenceId]
  }

  return {
    collectedEvidence,
    revealedFacts: snapshot.revealedFactIds,
    contradictionsFlagged: [],
    presentedEvidence,
    entity: {
      attention: 0,
      stage: 0,
      firedRules: [],
      disturbed: [],
      lockedObjects: [],
      messages: [],
    },
  }
}

export function resolveWitnessTurn(
  input: ResolverInput,
  witness: Witness,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _caseData: Case001
): ResolverOutput {
  const state = snapshotToState(input)

  const allowedFacts: WitnessFact[] = []
  const lockedFacts: WitnessFact[] = []

  for (const fact of witness.facts) {
    if (evaluateCondition(fact.revealWhen, state)) {
      allowedFacts.push(fact)
    } else {
      lockedFacts.push(fact)
    }
  }

  // Active lie lines: facts that are allowed but whose lieAllowedUntil is not yet met
  const activeLieLines: string[] = []
  for (const fact of allowedFacts) {
    if (fact.lieAllowedUntil && fact.deniedLine) {
      const lieStillAllowed = !evaluateCondition(fact.lieAllowedUntil, state)
      if (lieStillAllowed) {
        activeLieLines.push(`${fact.id}: ${fact.deniedLine}`)
      }
    }
  }

  // Trust delta from presented evidence
  let trustDelta = 0
  if (input.presentedEvidenceId) {
    const eventKey = `presented-${input.presentedEvidenceId}`
    for (const rule of witness.trustRules) {
      if (rule.on === eventKey) trustDelta += rule.delta
    }
  }

  // Reveal guarantee: allowed facts not yet in revealedFactIds
  const revealGuarantee = allowedFacts.filter(
    (f) => !input.snapshot.revealedFactIds.includes(f.id)
  )

  return { allowedFacts, lockedFacts, activeLieLines, trustDelta, revealGuarantee }
}
