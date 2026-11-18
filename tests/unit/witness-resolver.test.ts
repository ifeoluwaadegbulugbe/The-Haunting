import { describe, it, expect } from 'vitest'
import { resolveWitnessTurn } from '@/lib/ai/witness/resolver'
import { CASE_001 } from '@/data/case001'

const margaret = CASE_001.witnesses.find((w) => w.id === 'margaret')!

describe('resolveWitnessTurn — Margaret', () => {
  it('always-available facts are in allowedFacts with empty snapshot', () => {
    const result = resolveWitnessTurn(
      {
        witnessId: 'margaret',
        snapshot: { collectedEvidenceIds: [], revealedFactIds: [], trust: 50, recentTurns: [] },
      },
      margaret,
      CASE_001
    )
    // M1 and M2 have empty revealWhen → always allowed
    expect(result.allowedFacts.map((f) => f.id)).toContain('M1')
    expect(result.allowedFacts.map((f) => f.id)).toContain('M2')
  })

  it('M4 is locked without EV-11 presented', () => {
    const result = resolveWitnessTurn(
      {
        witnessId: 'margaret',
        snapshot: { collectedEvidenceIds: ['EV-11'], revealedFactIds: [], trust: 50, recentTurns: [] },
      },
      margaret,
      CASE_001
    )
    // M4 revealWhen requires presentedEvidence margaret:EV-11
    expect(result.lockedFacts.map((f) => f.id)).toContain('M4')
  })

  it('M4 is allowed when EV-11 is presented to margaret', () => {
    const result = resolveWitnessTurn(
      {
        witnessId: 'margaret',
        presentedEvidenceId: 'EV-11',
        snapshot: { collectedEvidenceIds: ['EV-11'], revealedFactIds: [], trust: 50, recentTurns: [] },
      },
      margaret,
      CASE_001
    )
    expect(result.allowedFacts.map((f) => f.id)).toContain('M4')
  })

  it('trust delta is correct for presented EV-11', () => {
    const result = resolveWitnessTurn(
      {
        witnessId: 'margaret',
        presentedEvidenceId: 'EV-11',
        snapshot: { collectedEvidenceIds: ['EV-11'], revealedFactIds: [], trust: 50, recentTurns: [] },
      },
      margaret,
      CASE_001
    )
    // Margaret's trustRules: presented-EV-11 → +15
    expect(result.trustDelta).toBe(15)
  })

  it('revealGuarantee contains newly allowed facts not yet revealed', () => {
    const result = resolveWitnessTurn(
      {
        witnessId: 'margaret',
        presentedEvidenceId: 'EV-11',
        snapshot: {
          collectedEvidenceIds: ['EV-11'],
          revealedFactIds: ['M1', 'M2'], // already revealed
          trust: 50,
          recentTurns: [],
        },
      },
      margaret,
      CASE_001
    )
    // M4 is now allowed and not yet revealed → should be in guarantee
    expect(result.revealGuarantee.map((f) => f.id)).toContain('M4')
    // M1 and M2 are already revealed → not in guarantee
    expect(result.revealGuarantee.map((f) => f.id)).not.toContain('M1')
  })

  it('no trust delta when no evidence presented', () => {
    const result = resolveWitnessTurn(
      {
        witnessId: 'margaret',
        snapshot: { collectedEvidenceIds: [], revealedFactIds: [], trust: 50, recentTurns: [] },
      },
      margaret,
      CASE_001
    )
    expect(result.trustDelta).toBe(0)
  })
})
