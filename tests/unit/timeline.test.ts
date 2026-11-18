import { describe, it, expect } from 'vitest'
import { validateTimelinePlacement } from '@/lib/evidence/timeline'
import { CASE_001 } from '@/data/case001'

// Canonical order: TL-01(0) TL-02(1) TL-03(2) TL-04(3) TL-05(4) TL-06(5) TL-07(6)
const CANONICAL: Record<string, string> = {
  '0': 'TL-01', '1': 'TL-02', '2': 'TL-03',
  '3': 'TL-04', '4': 'TL-05', '5': 'TL-06', '6': 'TL-07',
}

describe('validateTimelinePlacement', () => {
  it('canonical order produces zero conflicts', () => {
    const conflicts = validateTimelinePlacement(CANONICAL, CASE_001)
    expect(conflicts).toHaveLength(0)
  })

  it('placing TL-05 before TL-04 produces a conflict', () => {
    const bad = { ...CANONICAL, '3': 'TL-05', '4': 'TL-04' }
    const conflicts = validateTimelinePlacement(bad, CASE_001)
    // TL-05 requires TL-04; placing TL-05 at slot 3 and TL-04 at slot 4 → conflict
    expect(conflicts.length).toBeGreaterThan(0)
    expect(conflicts.some((c) => c.eventId === 'TL-05')).toBe(true)
  })

  it('placing TL-06 before TL-05 produces a conflict', () => {
    const bad = { ...CANONICAL, '4': 'TL-06', '5': 'TL-05' }
    const conflicts = validateTimelinePlacement(bad, CASE_001)
    expect(conflicts.some((c) => c.eventId === 'TL-06')).toBe(true)
  })

  it('empty placement produces no conflicts', () => {
    expect(validateTimelinePlacement({}, CASE_001)).toHaveLength(0)
  })

  it('partial placement with no violations produces no conflicts', () => {
    const partial = { '0': 'TL-01', '1': 'TL-02' }
    expect(validateTimelinePlacement(partial, CASE_001)).toHaveLength(0)
  })
})
