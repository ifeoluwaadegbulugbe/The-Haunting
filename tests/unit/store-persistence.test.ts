import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore, INITIAL_STATE } from '@/store/gameStore'
import { migrateState } from '@/store/migrations'

describe('store persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    useGameStore.setState({ ...INITIAL_STATE })
  })

  it('Test A — round-trip: dispatched state survives serialize/deserialize', () => {
    const s = useGameStore.getState()

    s.startInvestigation('Test')
    s.collectEvidence('EV-01')
    s.setTrust('margaret', 55)

    const serialized = JSON.stringify(useGameStore.getState())
    const deserialized = JSON.parse(serialized)

    expect(deserialized.investigator.name).toBe('Test')
    expect(deserialized.collectedEvidence['EV-01']).toBeDefined()
    expect(deserialized.witnessTrust['margaret']).toBe(55)
  })

  it('Test B — version mismatch: migrateState returns null', () => {
    const v0State = { ...INITIAL_STATE, version: 0 }
    expect(migrateState(v0State)).toBeNull()
  })

  it('Test B2 — version match: migrateState returns state as-is', () => {
    const v2State = { ...INITIAL_STATE }
    expect(migrateState(v2State)).toEqual(v2State)
  })

  it('collectEvidence is idempotent — no duplicates on key', () => {
    const s = useGameStore.getState()
    s.collectEvidence('EV-01')
    s.collectEvidence('EV-01')
    const keys = Object.keys(useGameStore.getState().collectedEvidence)
    expect(keys.filter((k) => k === 'EV-01')).toHaveLength(1)
  })

  it('flagContradiction is idempotent', () => {
    const s = useGameStore.getState()
    s.flagContradiction('CX-01')
    s.flagContradiction('CX-01')
    expect(
      useGameStore.getState().contradictionsFlagged.filter((c) => c === 'CX-01')
    ).toHaveLength(1)
  })

  it('addAttention caps at 99', () => {
    useGameStore.getState().addAttention(200)
    expect(useGameStore.getState().entity.attention).toBe(99)
  })

  it('addAttention floors at 0', () => {
    useGameStore.getState().addAttention(-999)
    expect(useGameStore.getState().entity.attention).toBe(0)
  })

  it('attention thresholds map to correct stages', () => {
    const reset = () =>
      useGameStore.setState((s) => ({
        entity: { ...s.entity, attention: 0, stage: 0 },
      }))

    reset()
    useGameStore.getState().addAttention(10) // 10 → dormant (0–14)
    expect(useGameStore.getState().entity.stage).toBe(0)

    reset()
    useGameStore.getState().addAttention(20) // 20 → aware (15–39)
    expect(useGameStore.getState().entity.stage).toBe(1)

    reset()
    useGameStore.getState().addAttention(50) // 50 → interfering (40–69)
    expect(useGameStore.getState().entity.stage).toBe(2)

    reset()
    useGameStore.getState().addAttention(75) // 75 → hostile (70–99)
    expect(useGameStore.getState().entity.stage).toBe(3)
  })
})
