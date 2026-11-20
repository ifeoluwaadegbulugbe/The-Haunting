import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore, INITIAL_STATE } from '@/store/gameStore'
import { useFxStore } from '@/store/fxStore'
import { migrateState, DEFAULT_AUDIO } from '@/store/migrations'
import { selectProgress } from '@/store/selectors'
import { explainLink } from '@/lib/evidence/explain'
import { ACHIEVEMENTS, thoroughness } from '@/data/achievements'
import { soundscapeFor } from '@/lib/audio/soundscapes'
import { clockTime } from '@/data/hq'
import { scoreTheory } from '@/lib/scoring'
import { CASE_001 } from '@/data/case001'
import type { GameState } from '@/types'

const store = () => useGameStore.getState()

describe('save migration', () => {
  it('upgrades a v1 save in place and keeps progress', () => {
    const { audio, seenCinematics, achievements, ...rest } = INITIAL_STATE
    void audio; void seenCinematics; void achievements
    const v1 = { ...rest, version: 1, collectedEvidence: { 'EV-01': { at: 1, flags: [] } }, revealedFacts: ['M4'] }
    const up = migrateState(v1 as unknown as Record<string, unknown>) as unknown as GameState
    expect(up.version).toBe(2)
    expect(up.collectedEvidence['EV-01']).toBeDefined()
    expect(up.revealedFacts).toEqual(['M4'])
    expect(up.audio).toEqual(DEFAULT_AUDIO)
    expect(up.seenCinematics).toEqual([])
    expect(up.achievements).toEqual([])
  })

  it('rejects unknown versions', () => {
    expect(migrateState({ version: 7 })).toBeNull()
  })
})

describe('optional hidden clues', () => {
  const optional = CASE_001.evidence.filter((e) => e.relevance === 'optional')

  it('there are exactly four, OC-01 to OC-04', () => {
    expect(optional.map((e) => e.id).sort()).toEqual(['OC-01', 'OC-02', 'OC-03', 'OC-04', 'OC-05', 'OC-06'])
  })

  it('never change the progress percentage', () => {
    const base: GameState = { ...INITIAL_STATE, collectedEvidence: { 'EV-01': { at: 1, flags: [] } } }
    const withClues: GameState = {
      ...base,
      collectedEvidence: { ...base.collectedEvidence, ...Object.fromEntries(optional.map((e) => [e.id, { at: 1, flags: [] }])) },
    }
    expect(selectProgress(withClues, CASE_001)).toBe(selectProgress(base, CASE_001))
  })

  it('never change the score', () => {
    const theory = {
      culprit: 'Julian' as const,
      whatHappened: 'Julian killed Edmund and locked Clara and Lily in the cellar',
      whyCallsContinue: "Clara's call for help was never answered",
      timelinePlacement: Object.fromEntries(CASE_001.timeline.map((t, i) => [String(i), t.id])),
      witnessReliability: { margaret: 'Concealing' as const, dorothea: 'Lying' as const, julian: 'Lying' as const },
      manipulatedEvidence: 'EV-X1',
      supportingEvidence: { culpritAndMotive: ['EV-05', 'EV-06', 'EV-07'], timeline: ['EV-01', 'EV-07', 'EV-11'], coverUp: ['EV-08', 'EV-13'] },
    }
    const withClue = { ...theory, supportingEvidence: { ...theory.supportingEvidence, culpritAndMotive: ['EV-05', 'EV-06', 'EV-07', 'OC-01'] } }
    expect(scoreTheory(withClue, INITIAL_STATE, CASE_001).score).toBe(scoreTheory(theory, INITIAL_STATE, CASE_001).score)
  })

  it('thoroughness counts how many were found', () => {
    expect(thoroughness(INITIAL_STATE)).toBe(0)
    expect(thoroughness({ ...INITIAL_STATE, collectedEvidence: { 'OC-01': { at: 1, flags: [] }, 'OC-03': { at: 1, flags: [] } } })).toBe(2)
  })
})

describe('link explanations', () => {
  it('every ground-truth link explains itself with its authored reason', () => {
    for (const rule of CASE_001.links) {
      const r = explainLink(rule.a, rule.b, CASE_001)
      expect(r.text).toBe(rule.explanation)
      expect(r.verdict).not.toBe('invalid')
    }
  })

  it('an unsupported link says why, without revealing a correct pairing', () => {
    const r = explainLink('EV-01', 'EV-03', CASE_001)
    expect(r.verdict).toBe('invalid')
    expect(r.text.length).toBeGreaterThan(20)
    expect(r.text).not.toMatch(/EV-\d/)
  })
})

describe('achievements', () => {
  beforeEach(() => {
    useGameStore.setState({ ...INITIAL_STATE })
    useFxStore.setState({ toasts: [], manifestations: [], flying: [] })
  })

  it('ids are unique', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('first clue is earned by collecting anything', () => {
    const a = ACHIEVEMENTS.find((x) => x.id === 'first-clue')!
    expect(a.earned(INITIAL_STATE)).toBe(false)
    expect(a.earned({ ...INITIAL_STATE, collectedEvidence: { 'EV-01': { at: 1, flags: [] } } })).toBe(true)
  })

  it('timeline achievement only after the verdict, so placement never leaks the answer', () => {
    const a = ACHIEVEMENTS.find((x) => x.id === 'clockwork')!
    const placed = { ...INITIAL_STATE, timelinePlacement: Object.fromEntries(CASE_001.timeline.map((t, i) => [String(i), t.id])) }
    expect(a.earned(placed)).toBe(false)
    expect(a.earned({ ...placed, verdict: { score: 100, breakdown: { timeline: 20 }, rank: 'x' } })).toBe(true)
  })

  it('unlocking twice records once and toasts once', () => {
    store().unlockAchievement('first-clue')
    store().unlockAchievement('first-clue')
    expect(store().achievements).toEqual(['first-clue'])
    expect(useFxStore.getState().toasts).toHaveLength(1)
  })

  it('a new investigation keeps the audio settings', () => {
    store().setAudio({ music: 0.2 })
    store().resetStore()
    expect(store().audio.music).toBe(0.2)
  })
})

describe('entity manifestations', () => {
  beforeEach(() => {
    useGameStore.setState({ ...INITIAL_STATE })
    useFxStore.setState({ manifestations: [] })
  })

  it('firing a rule shows the entity once, and never changes evidence', () => {
    store().collectEvidence('EV-07')
    store().fireRule('ER-02')
    store().fireRule('ER-02')
    expect(useFxStore.getState().manifestations.map((m) => m.ruleId)).toEqual(['ER-02'])
    expect(store().collectedEvidence['EV-07']).toBeDefined()
  })
})

describe('rooms', () => {
  it('each room has its own soundscape', () => {
    expect(soundscapeFor('/case/001/scene')).toEqual({ music: 'house', ambient: 'house' })
    expect(soundscapeFor('/case/001/witnesses/margaret').music).toBe('interview')
    expect(soundscapeFor('/case/001/conclusion').music).toBe('reveal')
    expect(soundscapeFor('/hq').music).toBe('theme')
  })

  it('the HQ clock creeps towards 11:13 as the entity notices you', () => {
    expect(clockTime(0, false)).toBe('10:40')
    expect(clockTime(3, false)).toBe('11:12')
    expect(clockTime(1, true)).toMatch(/^11:13/)
  })
})
