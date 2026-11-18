/**
 * The golden path: a scripted, deterministic run through the whole case.
 * Uses the real store and pure modules. No network, no AI provider.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore, INITIAL_STATE } from '@/store/gameStore'
import { selectUnlockedSections, selectProgress, selectRank } from '@/store/selectors'
import { evaluateCondition } from '@/lib/engine/conditions'
import { getCollectableObjects } from '@/lib/evidence/collection'
import { evaluateLink } from '@/lib/evidence/links'
import { getAvailableContradictions } from '@/lib/evidence/contradictions'
import { validateTimelinePlacement } from '@/lib/evidence/timeline'
import { resolveWitnessTurn } from '@/lib/ai/witness/resolver'
import { scoreTheory } from '@/lib/scoring'
import { CASE_001 } from '@/data/case001'
import type { Theory } from '@/types'

const store = () => useGameStore.getState()

/** Inspect a scene object the way the Scene page does. */
function inspect(objectId: string) {
  const obj = CASE_001.scene.find((o) => o.id === objectId)!
  expect(getCollectableObjects(store(), CASE_001).map((o) => o.id)).toContain(objectId)
  store().discoverObject(obj.id)
  store().inspectObject(obj.id)
  for (const evId of obj.yieldsEvidence) store().collectEvidence(evId)
}

/**
 * One interrogation turn as the API route resolves it (deterministic part only).
 * Applies the reveal guarantee and trust change, then settles cascading facts.
 */
function turn(witnessId: string, presentedEvidenceId?: string) {
  const witness = CASE_001.witnesses.find((w) => w.id === witnessId)!
  // The client sends the presentation history from BEFORE this item is marked
  const historyBefore = [...(store().presentedEvidence[witnessId] ?? [])]
  if (presentedEvidenceId) store().markEvidencePresented(witnessId, presentedEvidenceId)

  let evidenceForThisCall = presentedEvidenceId
  let history = historyBefore
  for (let i = 0; i < 5; i++) {
    const s = store()
    const out = resolveWitnessTurn(
      {
        witnessId,
        presentedEvidenceId: evidenceForThisCall,
        snapshot: {
          collectedEvidenceIds: Object.keys(s.collectedEvidence),
          revealedFactIds: s.revealedFacts,
          presentedEvidenceIds: history,
          trust: s.witnessTrust[witnessId] ?? 50,
          recentTurns: [],
        },
      },
      witness,
      CASE_001
    )
    if (out.trustDelta) store().setTrust(witnessId, (s.witnessTrust[witnessId] ?? 50) + out.trustDelta)
    // Later passes only cascade facts unlocked by the first one
    evidenceForThisCall = undefined
    history = [...(store().presentedEvidence[witnessId] ?? [])]
    if (out.revealGuarantee.length === 0) break
    for (const f of out.revealGuarantee) store().revealFact(f.id)
  }
}
const GOLDEN_THEORY: Theory = {
  culprit: 'Julian',
  whatHappened: 'Julian killed Edmund and locked Clara and Lily in the cellar',
  whyCallsContinue: "Clara's call for help was never answered",
  timelinePlacement: {},
  witnessReliability: { margaret: 'Concealing', dorothea: 'Lying', julian: 'Lying' },
  manipulatedEvidence: 'EV-X1',
  supportingEvidence: {
    culpritAndMotive: ['EV-05', 'EV-06', 'EV-07'],
    timeline: ['EV-01', 'EV-07', 'EV-11'],
    coverUp: ['EV-08', 'EV-13'],
  },
}

describe('golden path', () => {
  beforeEach(() => {
    useGameStore.setState({ ...INITIAL_STATE })
  })

  it('completes the whole case and scores exactly 100', () => {
    // 1. Start
    store().startInvestigation('Test Investigator')

    // 2. Scene: dependency order is enforced
    const ids = () => getCollectableObjects(store(), CASE_001).map((o) => o.id)
    expect(ids()).not.toContain('OBJ-clock')
    expect(ids()).not.toContain('OBJ-cabinet')
    for (const id of [
      'OBJ-telephone', 'OBJ-photograph', 'OBJ-diary', 'OBJ-clippings',
      'OBJ-clock', 'OBJ-recorder', 'OBJ-cabinet', 'OBJ-belongings', 'OBJ-rug',
    ]) inspect(id)
    expect(Object.keys(store().collectedEvidence)).toHaveLength(10) // EV-01..EV-10

    // 3. Archive unlocks, witnesses still locked
    expect(selectUnlockedSections(store()).archive).toBe(true)
    expect(selectUnlockedSections(store()).witnesses).toBe(false)
    for (const rec of CASE_001.digital.filter((r) => r.yieldsEvidence)) {
      const ok = rec.recoveryCondition ? evaluateCondition(rec.recoveryCondition, store()) : true
      expect(ok).toBe(true)
      store().recoverRecord(rec.id)
      store().collectEvidence(rec.yieldsEvidence!)
    }
    expect(selectUnlockedSections(store()).witnesses).toBe(true)

    // 4. Interrogate: opening turn, then present the key evidence
    for (const w of ['margaret', 'dorothea', 'julian']) turn(w)
    turn('margaret', 'EV-14')
    turn('margaret', 'EV-11')
    turn('dorothea', 'EV-08')
    turn('dorothea', 'EV-13')
    for (const ev of ['EV-03', 'EV-14', 'EV-15', 'EV-07', 'EV-06']) turn('julian', ev)

    // The entity plants EV-X1 (as ER-06 / ER-06b would); the player disproves it.
    store().plantEvidence('EV-X1')
    turn('dorothea', 'EV-X1')

    for (const fact of ['M4', 'M5', 'M6', 'D3', 'D4', 'D5', 'J4', 'J5', 'J6', 'M3']) {
      expect(store().revealedFacts, `fact ${fact}`).toContain(fact)
    }

    // 5. Contradictions: all seven become available and are confirmed by the player
    const available = getAvailableContradictions(store(), CASE_001)
    expect(available.map((c) => c.id).sort()).toEqual(
      CASE_001.contradictions.map((c) => c.id).sort()
    )
    expect(store().contradictionsFlagged).toHaveLength(0) // never auto-confirmed
    for (const c of available) store().flagContradiction(c.id)

    // 6. Board: every ground-truth link resolves as valid or contradiction
    for (const rule of CASE_001.links) {
      const verdict = evaluateLink(rule.a, rule.b, CASE_001)
      expect(verdict).not.toBe('invalid')
      store().addLink(rule.a, rule.b, verdict)
    }

    // 7. Timeline in canonical order, with no structural conflicts
    CASE_001.timeline.forEach((ev, i) => store().placeTimelineEvent(String(i), ev.id))
    expect(validateTimelinePlacement(store().timelinePlacement, CASE_001)).toHaveLength(0)

    // 8. Conclusion unlocks
    expect(selectUnlockedSections(store()).conclusion).toBe(true)
    expect(selectProgress(store(), CASE_001)).toBe(100)

    // 9. Submit the golden theory
    const theory = { ...GOLDEN_THEORY, timelinePlacement: store().timelinePlacement }
    const result = scoreTheory(theory, store(), CASE_001)
    expect(result.score).toBe(100)
    expect(result.rank).toBe('Master of the Archive')
    expect(selectRank(result.score).rank).toBe(5)
  })

  it('presenting the same evidence twice does not farm trust', () => {
    store().collectEvidence('EV-11')
    turn('margaret', 'EV-11')
    const once = store().witnessTrust.margaret
    turn('margaret', 'EV-11')
    expect(store().witnessTrust.margaret).toBe(once)
  })
})
