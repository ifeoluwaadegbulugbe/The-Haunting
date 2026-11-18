import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore, INITIAL_STATE } from '@/store/gameStore'
import { evaluateEntityRules, dispatchEntityActions } from '@/lib/entity'
import { CASE_001 } from '@/data/case001'

const store = () => useGameStore.getState()

describe('entity hard limits', () => {
  beforeEach(() => useGameStore.setState({ ...INITIAL_STATE }))

  it('a lockout expires after its time runs out', () => {
    store().lockObject('OBJ-rug', 120_000)
    expect(store().entity.lockedObjects).toContain('OBJ-rug')
    store().expireLocks(Date.now() + 60_000)
    expect(store().entity.lockedObjects).toContain('OBJ-rug')
    store().expireLocks(Date.now() + 121_000)
    expect(store().entity.lockedObjects).not.toContain('OBJ-rug')
  })

  it('a lockout ends after two more inspections', () => {
    store().lockObject('OBJ-rug')
    store().inspectObject('OBJ-telephone')
    store().expireLocks()
    expect(store().entity.lockedObjects).toContain('OBJ-rug')
    store().inspectObject('OBJ-photograph')
    store().expireLocks()
    expect(store().entity.lockedObjects).not.toContain('OBJ-rug')
  })

  it('a lock with no expiry record (old save) is released, never permanent', () => {
    useGameStore.setState({ entity: { ...INITIAL_STATE.entity, lockedObjects: ['OBJ-rug'], locks: {} } })
    store().expireLocks()
    expect(store().entity.lockedObjects).toHaveLength(0)
  })

  it('ER-02 disturbs EV-07 without removing it, and re-verify clears it', () => {
    store().collectEvidence('EV-07')
    const s = store()
    dispatchEntityActions(
      evaluateEntityRules(s, { type: 'evidenceCollected', ref: 'EV-07' }, CASE_001),
      s,
      ''
    )
    expect(store().entity.disturbed).toContain('EV-07')
    expect(store().collectedEvidence['EV-07']).toBeDefined()
    store().reverifyEvidence('EV-07')
    expect(store().entity.disturbed).not.toContain('EV-07')
    expect(store().collectedEvidence['EV-07']).toBeDefined()
  })

  it('no entity rule can remove evidence, edit facts or block the Conclusion', () => {
    const allowed = new Set(['message', 'disturb', 'plant', 'lockout', 'overlay', 'apparition'])
    for (const rule of CASE_001.entityRules) {
      expect(allowed.has(rule.action), rule.id).toBe(true)
      // Only the false lead may be planted
      if (rule.action === 'plant') expect(rule.targetRef).toBe('EV-X1')
      // Lockouts may never target the Conclusion or a required route
      if (rule.action === 'lockout') expect(rule.targetRef?.startsWith('OBJ-')).toBe(true)
    }
  })

  it('ER-06b plants EV-X1 when the Conclusion is opened without it', () => {
    const s = store()
    dispatchEntityActions(evaluateEntityRules(s, { type: 'conclusionOpened' }, CASE_001), s, '')
    expect(store().collectedEvidence['EV-X1']?.flags).toContain('entity-planted')
    expect(store().entity.firedRules).toContain('ER-06b')
  })
})
