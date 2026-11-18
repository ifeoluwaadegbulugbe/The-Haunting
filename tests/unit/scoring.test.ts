import { describe, it, expect } from 'vitest'
import { scoreTheory } from '@/lib/scoring/score'
import { INITIAL_STATE } from '@/store/gameStore'
import { CASE_001 } from '@/data/case001'
import type { Theory, GameState } from '@/types'

function makeState(overrides: Partial<GameState> = {}): GameState {
  return { ...INITIAL_STATE, ...overrides }
}

// Perfect theory answers
const GOLDEN_THEORY: Theory = {
  culprit:        'Julian',
  whatHappened:   'Julian killed Edmund and locked Clara and Lily in the cellar',
  whyCallsContinue: "Clara's call for help was never answered",
  timelinePlacement: {
    '0': 'TL-01', '1': 'TL-02', '2': 'TL-03',
    '3': 'TL-04', '4': 'TL-05', '5': 'TL-06', '6': 'TL-07',
  },
  witnessReliability: {
    margaret: 'Concealing',
    dorothea: 'Lying',
    julian:   'Lying',
  },
  manipulatedEvidence: 'EV-X1',
  supportingEvidence: {
    culpritAndMotive: ['EV-05', 'EV-06', 'EV-07'],
    timeline:         ['EV-01', 'EV-07', 'EV-11'],
    coverUp:          ['EV-08', 'EV-13'],
  },
}

describe('scoreTheory', () => {
  it('golden path scores exactly 100', () => {
    const result = scoreTheory(GOLDEN_THEORY, makeState(), CASE_001)
    expect(result.score).toBe(100)
    expect(result.rank).toBe('Master of the Archive')
  })

  it('wrong culprit loses exactly 25 points (culprit 10 + what happened 15)', () => {
    const theory: Theory = {
      ...GOLDEN_THEORY,
      culprit:      'Margaret',
      whatHappened: 'Something else happened',
    }
    const result = scoreTheory(theory, makeState(), CASE_001)
    expect(result.breakdown.culpritAndWhatHappened).toBe(0)
    expect(result.score).toBe(75)
  })

  it('wrong culprit with correct what-happened loses 10', () => {
    const theory: Theory = {
      ...GOLDEN_THEORY,
      culprit: 'Margaret',
    }
    const result = scoreTheory(theory, makeState(), CASE_001)
    expect(result.breakdown.culpritAndWhatHappened).toBe(15)
    expect(result.score).toBe(90)
  })

  it('one wrong timeline event loses the specified points', () => {
    // TL-07 is the 7th event (index 6), worth 2 pts
    const theory: Theory = {
      ...GOLDEN_THEORY,
      timelinePlacement: {
        '0': 'TL-01', '1': 'TL-02', '2': 'TL-03',
        '3': 'TL-04', '4': 'TL-05', '5': 'TL-06',
        '6': 'TL-01', // wrong
      },
    }
    const result = scoreTheory(theory, makeState(), CASE_001)
    // TL-07 not placed correctly → lose 2 pts
    expect(result.breakdown.timeline).toBe(18) // 20 - 2
  })

  it('citing EV-X1 as supporting evidence subtracts 5 from that section (never below 0)', () => {
    const theory: Theory = {
      ...GOLDEN_THEORY,
      supportingEvidence: {
        culpritAndMotive: ['EV-05', 'EV-06', 'EV-07', 'EV-X1'], // include EV-X1
        timeline:         ['EV-01', 'EV-07', 'EV-11'],
        coverUp:          ['EV-08', 'EV-13'],
      },
    }
    const result = scoreTheory(theory, makeState(), CASE_001)
    // Culprit evidence: 8 - 5 = 3
    expect(result.breakdown.evidenceInterpretation).toBe(3 + 8 + 4) // 15
    expect(result.score).toBe(95)
  })

  it('wrong manipulated evidence loses 10 points', () => {
    const theory: Theory = {
      ...GOLDEN_THEORY,
      manipulatedEvidence: 'EV-01',
    }
    const result = scoreTheory(theory, makeState(), CASE_001)
    expect(result.breakdown.manipulatedEvidence).toBe(0)
    expect(result.score).toBe(90)
  })

  it('all three witnesses wrong loses 15 points', () => {
    const theory: Theory = {
      ...GOLDEN_THEORY,
      witnessReliability: {
        margaret: 'Honest',
        dorothea: 'Honest',
        julian:   'Honest',
      },
    }
    const result = scoreTheory(theory, makeState(), CASE_001)
    expect(result.breakdown.witnessReliability).toBe(0)
    expect(result.score).toBe(85)
  })
})
