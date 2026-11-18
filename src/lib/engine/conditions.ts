import type { Condition, GameState } from '@/types'

type ConditionState = Pick<
  GameState,
  'collectedEvidence' | 'revealedFacts' | 'contradictionsFlagged' |
  'presentedEvidence' | 'entity' | 'witnessTrust'
>

/**
 * Evaluates a Condition against the current game state.
 * An empty condition {} always returns true.
 */
export function evaluateCondition(
  condition: Condition,
  state: ConditionState
): boolean {
  const { allOf, anyOf } = condition

  if ((!allOf || allOf.length === 0) && (!anyOf || anyOf.length === 0)) {
    return true
  }

  if (allOf && allOf.length > 0) {
    if (!allOf.every((check) => evaluateCheck(check, state))) return false
  }

  if (anyOf && anyOf.length > 0) {
    if (!anyOf.some((check) => evaluateCheck(check, state))) return false
  }

  return true
}

function evaluateCheck(
  check: { type: string; ref: string | number },
  state: ConditionState
): boolean {
  const { type, ref } = check

  switch (type) {
    case 'hasEvidence':
      return String(ref) in state.collectedEvidence

    case 'hasFact':
      return state.revealedFacts.includes(String(ref))

    case 'hasContradiction':
      return state.contradictionsFlagged.includes(String(ref))

    case 'presentedEvidence': {
      // ref encodes as "witnessId:evidenceId" or just "evidenceId"
      const refStr = String(ref)
      if (refStr.includes(':')) {
        const parts = refStr.split(':')
        if (parts.length !== 2) return false
        const [witnessId, evidenceId] = parts
        return state.presentedEvidence[witnessId]?.includes(evidenceId) ?? false
      }
      // No witness prefix — check if presented to any witness
      return Object.values(state.presentedEvidence).some((ids) =>
        ids.includes(refStr)
      )
    }

    case 'trustAtLeast':
    case 'trustBelow': {
      // ref encodes as "witnessId:threshold"; missing trust defaults to 50
      const [witnessId, raw] = String(ref).split(':')
      const threshold = Number(raw)
      if (!witnessId || Number.isNaN(threshold)) return false
      const trust = state.witnessTrust[witnessId] ?? 50
      return type === 'trustAtLeast' ? trust >= threshold : trust < threshold
    }

    case 'stageAtLeast':
      return state.entity.stage >= Number(ref)

    default:
      return false
  }
}

// ── Condition failure messages ─────────────────────────────────────────────
// Human-readable explanation of why a condition is not yet met.
// Authored per object — these are narrative strings, not computed.

const OBJECT_CONDITION_MESSAGES: Record<string, string> = {
  'OBJ-clock':
    'Requires: Rotary Telephone — inspect the telephone first.',
  'OBJ-recorder':
    'Requires: Rotary Telephone — inspect the telephone first.',
  'OBJ-cabinet':
    "Requires: Clara's Diary — find the key inside.",
  'OBJ-belongings':
    'Requires: Torn Family Photograph — examine the photograph first.',
  'OBJ-rug':
    "Requires: Lily's Drawing — find it in her belongings.",
}

export function conditionMessage(objectId: string): string {
  return (
    OBJECT_CONDITION_MESSAGES[objectId] ??
    'Further investigation required before this can be examined.'
  )
}

// ── Digital Archives unlock message ───────────────────────────────────────

export function archiveUnlockMessage(): string {
  return (
    'The Digital Archives are locked.\n\n' +
    'You need:\n' +
    '· Rotary Telephone (EV-01) — inspect the telephone in the study.\n' +
    '· Final Night Recording (EV-07) — inspect the study recorder.'
  )
}
