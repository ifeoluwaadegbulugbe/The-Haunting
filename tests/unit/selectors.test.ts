import { describe, it, expect } from 'vitest'
import { selectProgress, selectUnlockedSections } from '@/store/selectors'
import { INITIAL_STATE } from '@/store/gameStore'
import { CASE_001 } from '@/data/case001'
import type { GameState } from '@/types'

function makeState(overrides: Partial<GameState> = {}): GameState {
  return { ...INITIAL_STATE, ...overrides }
}

describe('selectProgress', () => {
  it('returns 0 with zero state', () => {
    expect(selectProgress(makeState(), CASE_001)).toBe(0)
  })

  it('returns 100 with everything complete', () => {
    // Collect all 15 genuine evidence items
    const collectedEvidence = Object.fromEntries(
      CASE_001.evidence
        .filter((e) => e.authenticity === 'genuine')
        .map((e) => [e.id, { at: Date.now(), flags: [] }])
    )

    // Confirm all 7 contradictions
    const contradictionsFlagged = CASE_001.contradictions.map((c) => c.id)

    // Make all 13 valid links
    const links = CASE_001.links.map((l) => ({
      a: l.a,
      b: l.b,
      verdict: (l.type === 'contradicts' ? 'contradiction' : 'valid') as
        'valid' | 'invalid' | 'contradiction',
    }))

    // Reveal all non-default facts
    const nonDefaultFacts = CASE_001.witnesses.flatMap((w) =>
      w.facts
        .filter((f) => {
          const rw = f.revealWhen
          return (rw.allOf && rw.allOf.length > 0) || (rw.anyOf && rw.anyOf.length > 0)
        })
        .map((f) => f.id)
    )

    // Fill all 7 timeline slots
    const timelinePlacement = Object.fromEntries(
      CASE_001.timeline.map((t, i) => [`slot-${i}`, t.id])
    )

    const state = makeState({
      collectedEvidence,
      contradictionsFlagged,
      links,
      revealedFacts: nonDefaultFacts,
      timelinePlacement,
    })

    expect(selectProgress(state, CASE_001)).toBe(100)
  })
})

describe('selectUnlockedSections', () => {
  it('archive: false without EV-01 and EV-07', () => {
    expect(selectUnlockedSections(makeState()).archive).toBe(false)
  })

  it('archive: false with only EV-01', () => {
    const state = makeState({
      collectedEvidence: { 'EV-01': { at: 1, flags: [] } },
    })
    expect(selectUnlockedSections(state).archive).toBe(false)
  })

  it('archive: true with both EV-01 and EV-07', () => {
    const state = makeState({
      collectedEvidence: {
        'EV-01': { at: 1, flags: [] },
        'EV-07': { at: 2, flags: [] },
      },
    })
    expect(selectUnlockedSections(state).archive).toBe(true)
  })

  it('witnesses: false with fewer than 3 archive-evidence items', () => {
    const state = makeState({
      collectedEvidence: {
        'EV-11': { at: 1, flags: [] },
        'EV-12': { at: 2, flags: [] },
      },
    })
    expect(selectUnlockedSections(state).witnesses).toBe(false)
  })

  it('witnesses: true with 3 archive-evidence items', () => {
    const state = makeState({
      collectedEvidence: {
        'EV-11': { at: 1, flags: [] },
        'EV-12': { at: 2, flags: [] },
        'EV-13': { at: 3, flags: [] },
      },
    })
    expect(selectUnlockedSections(state).witnesses).toBe(true)
  })

  it('scene is always true', () => {
    expect(selectUnlockedSections(makeState()).scene).toBe(true)
  })

  it('conclusion: false when conditions not met', () => {
    expect(selectUnlockedSections(makeState()).conclusion).toBe(false)
  })
})
