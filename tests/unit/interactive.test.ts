import { describe, it, expect, beforeEach } from 'vitest'
import { checkLaptopPassword, laptopHint, inCar, onPlate, unzoom, PHOTO_TARGETS } from '@/lib/engine/puzzles'
import { buildNotebook } from '@/lib/case/notebook'
import { contradictionForChallenge } from '@/lib/evidence/contradictions'
import { evaluateCondition } from '@/lib/engine/conditions'
import { selectProgress } from '@/store/selectors'
import { useGameStore, INITIAL_STATE } from '@/store/gameStore'
import { INCOMING_CALLS, CALL_ANSWER_ATTENTION, CALL_IGNORE_ATTENTION } from '@/data/case001/calls'
import { LILY_ROOM_OBJECTS, LILY_ROOM_UNLOCK } from '@/data/case001/lily-room'
import { OPTIONAL, OPTIONAL_TOTAL } from '@/data/achievements'
import { CASE_001 } from '@/data/case001'
import type { GameState } from '@/types'

const held = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, { at: 1, flags: [] }]))
const state = (o: Partial<GameState> = {}): GameState => ({ ...INITIAL_STATE, ...o })

describe('laptop password', () => {
  it('accepts the answer written in the diary, however it is typed', () => {
    for (const p of ['lily14', 'Lily 14', 'LILY14th', ' lily-14 ']) expect(checkLaptopPassword(p)).toBe(true)
  })
  it('rejects near misses', () => {
    for (const p of ['lily', '14', 'lily1113', 'clara14', '']) expect(checkLaptopPassword(p)).toBe(false)
  })
  it('hints escalate until the answer is given, so nobody is stuck', () => {
    expect(laptopHint(0)).toBeNull()
    expect(laptopHint(1)).toBeNull()
    expect(laptopHint(2)).toMatch(/diary/)
    expect(laptopHint(4)).toMatch(/concert/)
    expect(laptopHint(6)).toMatch(/lily14/)
  })
})

describe('photo enhancement', () => {
  it('finds the car, then the plate through the zoom', () => {
    expect(inCar(PHOTO_TARGETS.car.x, PHOTO_TARGETS.car.y)).toBe(true)
    expect(inCar(10, 10)).toBe(false)
    // At the first zoom (x2.4 around the car), the plate appears further right and lower
    const s = 2.4
    const o = { x: PHOTO_TARGETS.car.x, y: PHOTO_TARGETS.car.y }
    const shown = { x: o.x + (PHOTO_TARGETS.plate.x - o.x) * s, y: o.y + (PHOTO_TARGETS.plate.y - o.y) * s }
    const back = unzoom(shown, o, s)
    expect(onPlate(back.x, back.y)).toBe(true)
    expect(onPlate(20, 20)).toBe(false)
  })
})

describe('challenging a statement', () => {
  it('confirms only pairs from the contradiction table', () => {
    expect(contradictionForChallenge('ST-J-ABROAD', 'EV-14', CASE_001.contradictions)?.id).toBe('CX-03')
    expect(contradictionForChallenge('ST-J-ABROAD', 'EV-15', CASE_001.contradictions)?.id).toBe('CX-04')
    expect(contradictionForChallenge('ST-M-DENY', 'EV-11', CASE_001.contradictions)?.id).toBe('CX-01')
    expect(contradictionForChallenge('ST-J-ABROAD', 'EV-03', CASE_001.contradictions)).toBeUndefined()
    expect(contradictionForChallenge(undefined, 'EV-14', CASE_001.contradictions)).toBeUndefined()
  })
})

describe('notebook', () => {
  it('starts with every question open and nothing in doubt', () => {
    const nb = buildNotebook(state(), CASE_001)
    expect(nb.questions.every((q) => q.answer === null)).toBe(true)
    expect(nb.doubts).toEqual([])
    expect(nb.foundCount).toBe(0)
  })
  it('answers questions from evidence and lists contradictions the player holds', () => {
    const nb = buildNotebook(state({
      collectedEvidence: held(['EV-11', 'EV-04', 'EV-14']),
      contradictionsFlagged: ['CX-06'],
    }), CASE_001)
    expect(nb.questions.find((q) => q.id === 'NQ-calls')?.answer).toMatch(/Ext 2/)
    expect(nb.questions.find((q) => q.id === 'NQ-julian')?.answer).toMatch(/22:31/)
    expect(nb.questions.find((q) => q.id === 'NQ-dorothea')?.answer).toBeNull()
    expect(nb.doubts).toEqual([expect.objectContaining({ id: 'CX-06', confirmed: true })])
  })
})

describe('the 11:13 calls', () => {
  beforeEach(() => useGameStore.getState().resetStore())

  it('ring at fixed moments', () => {
    const at = (s: GameState) => INCOMING_CALLS.filter((c) => evaluateCondition(c.when, s)).map((c) => c.id)
    expect(at(state())).toEqual([])
    expect(at(state({ collectedEvidence: held(['EV-01', 'EV-07']) }))).toEqual(['CALL-1'])
    expect(at(state({ collectedEvidence: held(['EV-01', 'EV-07', 'EV-12']), revealedFacts: ['M4'] }))).toEqual(['CALL-1', 'CALL-2', 'CALL-3'])
  })

  it('answering calms the entity and ignoring provokes it', () => {
    expect(CALL_ANSWER_ATTENTION).toBeLessThan(0)
    expect(CALL_IGNORE_ATTENTION).toBeGreaterThan(0)
  })

  it('each call resolves once', () => {
    const s = useGameStore.getState()
    s.resolveCall('CALL-1', 'answered')
    s.resolveCall('CALL-1', 'ignored')
    expect(useGameStore.getState().calls).toEqual({ 'CALL-1': 'answered' })
  })

  it('never changes evidence or facts', () => {
    useGameStore.getState().resolveCall('CALL-2', 'ignored')
    const after = useGameStore.getState()
    expect(after.collectedEvidence).toEqual({})
    expect(after.revealedFacts).toEqual([])
  })
})

describe("Lily's room", () => {
  it('opens once Lily\u2019s drawing is found', () => {
    expect(evaluateCondition(LILY_ROOM_UNLOCK, state())).toBe(false)
    expect(evaluateCondition(LILY_ROOM_UNLOCK, state({ collectedEvidence: held(['EV-09']) }))).toBe(true)
  })

  it('holds only optional details that exist in the evidence catalogue', () => {
    const yields = LILY_ROOM_OBJECTS.flatMap((o) => (o.yields ? [o.yields] : []))
    expect(yields.sort()).toEqual(['OC-05', 'OC-06'])
    for (const id of yields) expect(CASE_001.evidence.find((e) => e.id === id)?.relevance).toBe('optional')
    expect(OPTIONAL).toEqual(expect.arrayContaining(yields))
    expect(OPTIONAL_TOTAL).toBe(6)
  })

  it('its details do not change progress', () => {
    const base = state({ collectedEvidence: held(['EV-01', 'EV-09']) })
    const more = state({ collectedEvidence: held(['EV-01', 'EV-09', 'OC-05', 'OC-06']) })
    expect(selectProgress(more, CASE_001)).toBe(selectProgress(base, CASE_001))
  })
})

describe('device unlocks', () => {
  beforeEach(() => useGameStore.getState().resetStore())
  it('are recorded once and cleared by a new investigation', () => {
    const s = useGameStore.getState()
    s.unlockDevice('laptop'); s.unlockDevice('laptop')
    expect(useGameStore.getState().deviceUnlocks).toEqual(['laptop'])
    useGameStore.getState().resetStore()
    expect(useGameStore.getState().deviceUnlocks).toEqual([])
  })
})
