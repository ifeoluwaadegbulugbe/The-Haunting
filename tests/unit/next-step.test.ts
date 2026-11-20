import { describe, it, expect } from 'vitest'
import { selectNextStep } from '@/store/selectors'
import { INITIAL_STATE } from '@/store/gameStore'
import { CASE_001 } from '@/data/case001'
import type { GameState } from '@/types'

const held = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, { at: 1, flags: [] }]))
const SCENE = ['EV-01', 'EV-02', 'EV-03', 'EV-04', 'EV-05', 'EV-06', 'EV-07', 'EV-08', 'EV-09', 'EV-10']
const ARCHIVE = ['EV-11', 'EV-12', 'EV-13', 'EV-14', 'EV-15']
const state = (o: Partial<GameState>): GameState => ({ ...INITIAL_STATE, ...o })

describe('selectNextStep', () => {
  it('points to the study while scene evidence is missing', () => {
    const s = selectNextStep(state({ collectedEvidence: held(['EV-01', 'EV-07']) }), CASE_001)
    expect(s?.section).toBe('scene')
    expect(s?.text).toContain('8 items')
    expect(s?.text).toContain('Mantel Clock')
  })

  it('points to the archive once the study is searched', () => {
    const s = selectNextStep(state({ collectedEvidence: held(SCENE) }), CASE_001)
    expect(s?.section).toBe('archive')
    expect(s?.href).toBe('/case/001/archive')
  })

  it('points to the witnesses once the archive is logged', () => {
    const s = selectNextStep(state({ collectedEvidence: held([...SCENE, ...ARCHIVE]), revealedFacts: ['M1', 'M2', 'M3'] }), CASE_001)
    expect(s?.section).toBe('witnesses')
    expect(s?.text).toContain('1 of 6')
  })

  it('points to the board when contradictions are short', () => {
    const s = selectNextStep(state({
      collectedEvidence: held([...SCENE, ...ARCHIVE]),
      revealedFacts: ['M3', 'M4', 'M5', 'D2', 'D3', 'J2'],
      contradictionsFlagged: ['CX-01'],
    }), CASE_001)
    expect(s?.section).toBe('evidence')
  })

  it('points to the conclusion when it is open, and goes quiet after a verdict', () => {
    const ready = state({
      collectedEvidence: held([...SCENE, ...ARCHIVE]),
      revealedFacts: ['M3', 'M4', 'M5', 'D2', 'D3', 'J2'],
      contradictionsFlagged: ['CX-01', 'CX-02', 'CX-03'],
    })
    expect(selectNextStep(ready, CASE_001)?.section).toBe('conclusion')
    expect(selectNextStep({ ...ready, verdict: { score: 100 } } as unknown as GameState, CASE_001)).toBeNull()
  })
})
