import { describe, it, expect } from 'vitest'
import { getAvailableContradictions, getConfirmedContradictions } from '@/lib/evidence/contradictions'
import { INITIAL_STATE } from '@/store/gameStore'
import { CASE_001 } from '@/data/case001'
import type { GameState } from '@/types'

function makeState(overrides: Partial<GameState> = {}): GameState {
  return { ...INITIAL_STATE, ...overrides }
}

describe('getAvailableContradictions', () => {
  it('returns empty when player holds neither side', () => {
    expect(getAvailableContradictions(makeState(), CASE_001)).toHaveLength(0)
  })

  it('CX-01 available when player holds ST-M-DENY (via revealedFacts M4) and EV-11', () => {
    // M4.yieldsStatementId = 'ST-M-DENY'
    const state = makeState({
      revealedFacts: ['M4'],
      collectedEvidence: { 'EV-11': { at: 1, flags: [] } },
    })
    const available = getAvailableContradictions(state, CASE_001)
    expect(available.map((c) => c.id)).toContain('CX-01')
  })

  it('CX-01 NOT available when only EV-11 held (missing statement)', () => {
    const state = makeState({
      collectedEvidence: { 'EV-11': { at: 1, flags: [] } },
    })
    const available = getAvailableContradictions(state, CASE_001)
    expect(available.map((c) => c.id)).not.toContain('CX-01')
  })

  it('CX-06 available when player holds both EV-04 and EV-14', () => {
    const state = makeState({
      collectedEvidence: {
        'EV-04': { at: 1, flags: [] },
        'EV-14': { at: 2, flags: [] },
      },
    })
    const available = getAvailableContradictions(state, CASE_001)
    expect(available.map((c) => c.id)).toContain('CX-06')
  })
})

describe('getConfirmedContradictions', () => {
  it('returns empty when no contradictions flagged', () => {
    expect(getConfirmedContradictions(makeState(), CASE_001)).toHaveLength(0)
  })

  it('returns only flagged contradictions', () => {
    const state = makeState({ contradictionsFlagged: ['CX-01', 'CX-06'] })
    const confirmed = getConfirmedContradictions(state, CASE_001)
    expect(confirmed.map((c) => c.id)).toContain('CX-01')
    expect(confirmed.map((c) => c.id)).toContain('CX-06')
    expect(confirmed).toHaveLength(2)
  })

  it('flagging does not auto-happen — requires explicit action', () => {
    // Even with both sides held, it is NOT confirmed until flagged
    const state = makeState({
      revealedFacts: ['M4'],
      collectedEvidence: { 'EV-11': { at: 1, flags: [] } },
      contradictionsFlagged: [], // NOT flagged
    })
    const confirmed = getConfirmedContradictions(state, CASE_001)
    expect(confirmed.map((c) => c.id)).not.toContain('CX-01')
  })
})
