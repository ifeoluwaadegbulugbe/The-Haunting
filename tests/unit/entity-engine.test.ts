import { describe, it, expect } from 'vitest'
import { evaluateEntityRules } from '@/lib/entity/engine'
import { INITIAL_STATE } from '@/store/gameStore'
import { CASE_001 } from '@/data/case001'
import type { GameState } from '@/types'

function makeState(overrides: Partial<GameState> = {}): GameState {
  return { ...INITIAL_STATE, ...overrides }
}

describe('evaluateEntityRules', () => {
  it('ER-01 fires on OBJ-telephone first inspection (stage 0)', () => {
    const state = makeState({ investigator: { name: 'Test', startedAt: 0 } })
    const actions = evaluateEntityRules(
      state,
      { type: 'objectInspected', ref: 'OBJ-telephone' },
      CASE_001
    )
    expect(actions.map((a) => a.ruleId)).toContain('ER-01')
  })

  it('ER-01 does not fire twice (once: true)', () => {
    const state = makeState({
      entity: { ...INITIAL_STATE.entity, firedRules: ['ER-01'] },
    })
    const actions = evaluateEntityRules(
      state,
      { type: 'objectInspected', ref: 'OBJ-telephone' },
      CASE_001
    )
    expect(actions.map((a) => a.ruleId)).not.toContain('ER-01')
  })

  it('ER-02 fires when EV-07 is collected', () => {
    const state = makeState()
    const actions = evaluateEntityRules(
      state,
      { type: 'evidenceCollected', ref: 'EV-07' },
      CASE_001
    )
    expect(actions.map((a) => a.ruleId)).toContain('ER-02')
    const er02 = actions.find((a) => a.ruleId === 'ER-02')
    expect(er02?.action).toBe('disturb')
    expect(er02?.targetRef).toBe('EV-07')
  })

  it('ER-04 does NOT fire at stage 1 (requires stage 2)', () => {
    const state = makeState({
      entity: { ...INITIAL_STATE.entity, stage: 1 },
    })
    const actions = evaluateEntityRules(
      state,
      { type: 'evidenceCollected', ref: 'EV-14' },
      CASE_001
    )
    expect(actions.map((a) => a.ruleId)).not.toContain('ER-04')
  })

  it('ER-04 fires at stage 2', () => {
    const state = makeState({
      entity: { ...INITIAL_STATE.entity, stage: 2 },
    })
    const actions = evaluateEntityRules(
      state,
      { type: 'evidenceCollected', ref: 'EV-14' },
      CASE_001
    )
    expect(actions.map((a) => a.ruleId)).toContain('ER-04')
  })

  it('ER-07 returns attentionDelta of -30', () => {
    const state = makeState()
    const actions = evaluateEntityRules(
      state,
      { type: 'contradictionConfirmed', ref: 'CX-07' },
      CASE_001
    )
    const er07 = actions.find((a) => a.ruleId === 'ER-07')
    expect(er07).toBeDefined()
    expect(er07?.attentionDelta).toBe(-30)
  })

  it('ER-08 interpolates investigator name in line', () => {
    const state = makeState({
      investigator: { name: 'Alice', startedAt: 0 },
      entity: { ...INITIAL_STATE.entity, stage: 3 },
    })
    const actions = evaluateEntityRules(
      state,
      { type: 'stageReached', ref: '3' },
      CASE_001
    )
    const er08 = actions.find((a) => a.ruleId === 'ER-08')
    expect(er08?.line).toContain('Alice')
  })

  it('linksReached: ER-06 fires when 3 valid links exist at stage 2', () => {
    const state = makeState({
      entity: { ...INITIAL_STATE.entity, stage: 2 },
      links: [
        { a: 'EV-01', b: 'EV-11', verdict: 'valid' },
        { a: 'EV-02', b: 'EV-05', verdict: 'valid' },
        { a: 'EV-06', b: 'EV-07', verdict: 'valid' },
      ],
    })
    const actions = evaluateEntityRules(
      state,
      { type: 'linksReached', count: 3 },
      CASE_001
    )
    expect(actions.map((a) => a.ruleId)).toContain('ER-06')
  })

  it('linksReached: ER-06 does NOT fire with only 2 valid links', () => {
    const state = makeState({
      entity: { ...INITIAL_STATE.entity, stage: 2 },
      links: [
        { a: 'EV-01', b: 'EV-11', verdict: 'valid' },
        { a: 'EV-02', b: 'EV-05', verdict: 'valid' },
      ],
    })
    const actions = evaluateEntityRules(
      state,
      { type: 'linksReached', count: 3 },
      CASE_001
    )
    expect(actions.map((a) => a.ruleId)).not.toContain('ER-06')
  })
})
