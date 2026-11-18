import { describe, it, expect } from 'vitest'
import { evaluateCondition } from '@/lib/engine/conditions'
import { INITIAL_STATE } from '@/store/gameStore'
import type { GameState } from '@/types'

function makeState(overrides: Partial<GameState> = {}): GameState {
  return { ...INITIAL_STATE, ...overrides }
}

describe('evaluateCondition', () => {
  it('empty condition always returns true', () => {
    expect(evaluateCondition({}, makeState())).toBe(true)
  })

  it('empty allOf returns true', () => {
    expect(evaluateCondition({ allOf: [] }, makeState())).toBe(true)
  })

  it('empty anyOf returns true', () => {
    expect(evaluateCondition({ anyOf: [] }, makeState())).toBe(true)
  })

  describe('hasEvidence', () => {
    it('passes when evidence is collected', () => {
      const state = makeState({
        collectedEvidence: { 'EV-01': { at: 1, flags: [] } },
      })
      expect(
        evaluateCondition({ allOf: [{ type: 'hasEvidence', ref: 'EV-01' }] }, state)
      ).toBe(true)
    })

    it('fails when evidence is not collected', () => {
      expect(
        evaluateCondition(
          { allOf: [{ type: 'hasEvidence', ref: 'EV-01' }] },
          makeState()
        )
      ).toBe(false)
    })
  })

  describe('hasFact', () => {
    it('passes when fact is revealed', () => {
      const state = makeState({ revealedFacts: ['M4'] })
      expect(
        evaluateCondition({ allOf: [{ type: 'hasFact', ref: 'M4' }] }, state)
      ).toBe(true)
    })

    it('fails when fact is not revealed', () => {
      expect(
        evaluateCondition({ allOf: [{ type: 'hasFact', ref: 'M4' }] }, makeState())
      ).toBe(false)
    })
  })

  describe('hasContradiction', () => {
    it('passes when contradiction is flagged', () => {
      const state = makeState({ contradictionsFlagged: ['CX-01'] })
      expect(
        evaluateCondition(
          { allOf: [{ type: 'hasContradiction', ref: 'CX-01' }] },
          state
        )
      ).toBe(true)
    })

    it('fails when contradiction is not flagged', () => {
      expect(
        evaluateCondition(
          { allOf: [{ type: 'hasContradiction', ref: 'CX-01' }] },
          makeState()
        )
      ).toBe(false)
    })
  })

  describe('presentedEvidence', () => {
    it('passes when evidence was presented to the witness', () => {
      const state = makeState({
        presentedEvidence: { margaret: ['EV-11'] },
      })
      expect(
        evaluateCondition(
          { allOf: [{ type: 'presentedEvidence', ref: 'margaret:EV-11' }] },
          state
        )
      ).toBe(true)
    })

    it('fails when evidence was not presented', () => {
      expect(
        evaluateCondition(
          { allOf: [{ type: 'presentedEvidence', ref: 'margaret:EV-11' }] },
          makeState()
        )
      ).toBe(false)
    })

    it('fails with malformed ref (no colon) — still checks any-witness', () => {
      // No colon → checks if EV-11 presented to any witness
      const state = makeState({
        presentedEvidence: { margaret: ['EV-11'] },
      })
      expect(
        evaluateCondition(
          { allOf: [{ type: 'presentedEvidence', ref: 'EV-11' }] },
          state
        )
      ).toBe(true)
    })
  })

  describe('stageAtLeast', () => {
    it('passes when entity stage meets threshold', () => {
      const state = makeState({
        entity: { ...INITIAL_STATE.entity, stage: 2 },
      })
      expect(
        evaluateCondition(
          { allOf: [{ type: 'stageAtLeast', ref: 2 }] },
          state
        )
      ).toBe(true)
    })

    it('fails when entity stage is below threshold', () => {
      expect(
        evaluateCondition(
          { allOf: [{ type: 'stageAtLeast', ref: 2 }] },
          makeState()
        )
      ).toBe(false)
    })
  })

  describe('allOf', () => {
    it('passes when all checks pass', () => {
      const state = makeState({
        collectedEvidence: {
          'EV-01': { at: 1, flags: [] },
          'EV-07': { at: 2, flags: [] },
        },
      })
      expect(
        evaluateCondition(
          {
            allOf: [
              { type: 'hasEvidence', ref: 'EV-01' },
              { type: 'hasEvidence', ref: 'EV-07' },
            ],
          },
          state
        )
      ).toBe(true)
    })

    it('fails when any check fails', () => {
      const state = makeState({
        collectedEvidence: { 'EV-01': { at: 1, flags: [] } },
      })
      expect(
        evaluateCondition(
          {
            allOf: [
              { type: 'hasEvidence', ref: 'EV-01' },
              { type: 'hasEvidence', ref: 'EV-07' },
            ],
          },
          state
        )
      ).toBe(false)
    })
  })

  describe('anyOf', () => {
    it('passes when at least one check passes', () => {
      const state = makeState({
        collectedEvidence: { 'EV-01': { at: 1, flags: [] } },
      })
      expect(
        evaluateCondition(
          {
            anyOf: [
              { type: 'hasEvidence', ref: 'EV-01' },
              { type: 'hasEvidence', ref: 'EV-07' },
            ],
          },
          state
        )
      ).toBe(true)
    })

    it('fails when no checks pass', () => {
      expect(
        evaluateCondition(
          {
            anyOf: [
              { type: 'hasEvidence', ref: 'EV-01' },
              { type: 'hasEvidence', ref: 'EV-07' },
            ],
          },
          makeState()
        )
      ).toBe(false)
    })
  })
})
