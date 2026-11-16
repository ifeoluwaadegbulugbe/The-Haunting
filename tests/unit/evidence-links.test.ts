import { describe, it, expect } from 'vitest'
import { evaluateLink } from '@/lib/evidence/links'
import { CASE_001 } from '@/data/case001'

describe('evaluateLink', () => {
  it('returns valid for a known supporting pair (EV-01, EV-11)', () => {
    expect(evaluateLink('EV-01', 'EV-11', CASE_001)).toBe('valid')
  })

  it('is order-insensitive — (EV-11, EV-01) also valid', () => {
    expect(evaluateLink('EV-11', 'EV-01', CASE_001)).toBe('valid')
  })

  it('returns valid for a timeline pair (EV-07, EV-14)', () => {
    expect(evaluateLink('EV-07', 'EV-14', CASE_001)).toBe('valid')
  })

  it('returns contradiction for EV-X1 / EV-08', () => {
    expect(evaluateLink('EV-X1', 'EV-08', CASE_001)).toBe('contradiction')
  })

  it('is order-insensitive for contradiction (EV-08, EV-X1)', () => {
    expect(evaluateLink('EV-08', 'EV-X1', CASE_001)).toBe('contradiction')
  })

  it('returns invalid for a pair not in the table (EV-01, EV-03)', () => {
    expect(evaluateLink('EV-01', 'EV-03', CASE_001)).toBe('invalid')
  })

  it('returns invalid for a completely unknown pair', () => {
    expect(evaluateLink('EV-99', 'EV-00', CASE_001)).toBe('invalid')
  })

  it('all 13 link rules evaluate to valid or contradiction (none invalid)', () => {
    for (const rule of CASE_001.links) {
      const result = evaluateLink(rule.a, rule.b, CASE_001)
      expect(result).not.toBe('invalid')
    }
  })
})
