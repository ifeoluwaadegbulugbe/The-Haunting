import { describe, it, expect, beforeEach } from 'vitest'
import { findPoints, nextCombo, finalScore, searchStars, modeUnlocked, pickItems, scramble, hits, COMBO_WINDOW_MS } from '@/lib/engine/search'
import { taskStatus, traitKnown, suspectMatches, labSecondsLeft } from '@/lib/case/forensics'
import { currentChapter, pendingChapterEnd, objectionHolds, trialGrade, nextFragment, memoryLine, endingKind, partnerHint } from '@/store/story'
import { useGameStore, INITIAL_STATE, starsAvailable } from '@/store/gameStore'
import { isElevenThirteen, dayKey } from '@/components/entity/EntityPresence'
import { SEARCH_SCENES, ITEMS_PER_SEARCH } from '@/data/case001/search'
import { FORENSIC_TASKS } from '@/data/case001/forensics'
import { DEFENCE_POINTS, CLARA_FRAGMENTS, entityMemoryLine } from '@/data/case001/story'
import { CASE_001 } from '@/data/case001'
import type { GameState } from '@/types'

const held = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, { at: 1, flags: [] }]))
const state = (o: Partial<GameState> = {}): GameState => ({ ...INITIAL_STATE, ...o })
const study = SEARCH_SCENES.find((s) => s.id === 'study')!

describe('room search scoring', () => {
  it('builds a combo for quick finds and resets after a pause', () => {
    expect(nextCombo(0, null)).toBe(1)
    expect(nextCombo(1, COMBO_WINDOW_MS - 1)).toBe(2)
    expect(nextCombo(3, COMBO_WINDOW_MS + 1)).toBe(1)
    expect(findPoints(1)).toBe(100)
    expect(findPoints(9)).toBe(400)
  })
  it('scores time left and penalises misses, never below zero', () => {
    expect(finalScore(800, 30, 2)).toBe(800 + 300 - 100)
    expect(finalScore(0, 0, 50)).toBe(0)
  })
  it('gives no stars when time runs out, 1 to 5 otherwise', () => {
    expect(searchStars(5000, false)).toBe(0)
    expect(searchStars(100, true)).toBe(1)
    expect(searchStars(1400, true)).toBe(3)
    expect(searchStars(2400, true)).toBe(5)
  })
  it('opens each mode after a star in the one before', () => {
    expect(modeUnlocked('study', 'normal', {})).toBe(true)
    expect(modeUnlocked('study', 'candle', {})).toBe(false)
    expect(modeUnlocked('study', 'candle', { 'study:normal': { stars: 1 } })).toBe(true)
    expect(modeUnlocked('study', '1113', { 'study:scrambled': { stars: 2 } })).toBe(true)
  })
  it('picks a full list, with the moved objects in 11:13 mode', () => {
    const normal = pickItems(study, 'normal', 3)
    expect(normal).toHaveLength(ITEMS_PER_SEARCH)
    expect(new Set(normal.map((i) => i.id)).size).toBe(ITEMS_PER_SEARCH)
    const eleven = pickItems(study, '1113', 3)
    expect(eleven.slice(0, study.moved.length).every((i) => i.moved)).toBe(true)
  })
  it('scrambles names without leaving them unchanged', () => {
    for (const it of study.items) expect(scramble(it.name)).not.toBe(it.name.toUpperCase())
    expect(scramble('Quill').length).toBe(5)
  })
  it('detects a click on an item, allowing for the picture shape', () => {
    const it = study.items[0]
    expect(hits(it, it.x, it.y, study.ratio)).toBe(true)
    expect(hits(it, it.x + it.r * 2, it.y, study.ratio)).toBe(false)
  })
  it('keeps every item inside the picture', () => {
    for (const s of SEARCH_SCENES) for (const it of [...s.items, ...s.moved]) {
      expect(it.x).toBeGreaterThan(0); expect(it.x).toBeLessThan(100)
      expect(it.y).toBeGreaterThan(0); expect(it.y).toBeLessThan(100)
    }
  })
})

describe('stars', () => {
  beforeEach(() => useGameStore.getState().resetStore())
  it('are earned from best results and can be spent only if held', () => {
    const s = useGameStore.getState()
    s.recordSearch('study:normal', 1500, 3)
    s.recordSearch('study:normal', 900, 2) // worse: kept the best
    expect(useGameStore.getState().search['study:normal']).toEqual({ best: 1500, stars: 3 })
    expect(useGameStore.getState().spendStars(2)).toBe(true)
    expect(starsAvailable(useGameStore.getState())).toBe(1)
    expect(useGameStore.getState().spendStars(2)).toBe(false)
    expect(starsAvailable(useGameStore.getState())).toBe(1)
  })
})

describe('forensics', () => {
  const prints = FORENSIC_TASKS.find((t) => t.id === 'F-prints')!
  it('opens a task only with its evidence, then tracks the lab', () => {
    expect(taskStatus(prints, state())).toBe('locked')
    const s = state({ collectedEvidence: held(['EV-01']) })
    expect(taskStatus(prints, s)).toBe('open')
    const inLab = { ...s, lab: { 'F-prints': 10_000 } }
    expect(taskStatus(prints, inLab, 5_000)).toBe('in-lab')
    expect(labSecondsLeft('F-prints', inLab, 5_000)).toBe(5)
    expect(taskStatus(prints, inLab, 10_000)).toBe('ready')
    expect(taskStatus(prints, { ...inLab, forensics: ['F-prints'] }, 0)).toBe('done')
  })
  it('builds a profile that only Julian fits', () => {
    const s = state({ collectedEvidence: held(['EV-14', 'EV-10', 'EV-08']), forensics: ['F-jigsaw', 'F-plate', 'F-uv'] })
    expect(traitKnown('T-RING', s)).toBe(true)
    expect(traitKnown('T-FORGER', s)).toBe(true)
    const m = suspectMatches(s)
    // EV-08 also shows who could let themselves in (T-ACCESS), which Dorothea shares
    expect(m.find((x) => x.id === 'julian')).toMatchObject({ matches: 7, known: 7, fits: true })
    expect(m.find((x) => x.id === 'dorothea')).toMatchObject({ matches: 1, fits: false })
    expect(m.find((x) => x.id === 'margaret')?.matches).toBe(0)
  })
  it('keeps the early profile open: every suspect fits the first traits', () => {
    const s = { ...state({ collectedEvidence: held(['EV-17']) }), contradictionsFlagged: ['CX-01'] }
    expect(traitKnown('T-LIED', s)).toBe(true)
    expect(traitKnown('T-GRUDGE', s)).toBe(true)
    const m = suspectMatches(s)
    expect(m.find((x) => x.id === 'julian')?.fits).toBe(true)
    expect(m.find((x) => x.id === 'margaret')?.fits).toBe(true)
    expect(m.find((x) => x.id === 'dorothea')?.fits).toBe(false)
    // Only Julian fits every trait once the whole profile is known
    const all = { ...state({ collectedEvidence: held(['EV-14', 'EV-10', 'EV-08', 'EV-17']), forensics: ['F-jigsaw', 'F-plate', 'F-uv'] }), contradictionsFlagged: ['CX-01'] }
    expect(suspectMatches(all).filter((x) => x.fits).map((x) => x.id)).toEqual(['julian'])
  })
  it('only asks for evidence that exists', () => {
    const ids = new Set(CASE_001.evidence.map((e) => e.id))
    for (const t of FORENSIC_TASKS) for (const n of t.needs) expect(ids.has(n)).toBe(true)
  })
})

describe('chapters', () => {
  it('advance with the case and each ending shows once', () => {
    expect(currentChapter(state())?.number).toBe(1)
    const ch2 = state({ collectedEvidence: held(['EV-01', 'EV-07']) })
    expect(currentChapter(ch2)?.number).toBe(2)
    expect(pendingChapterEnd(ch2)?.id).toBe('chapter-1')
    expect(pendingChapterEnd({ ...ch2, seenCinematics: ['chapter-1'] })).toBeNull()
    expect(pendingChapterEnd({ ...ch2, verdict: { score: 1, breakdown: {}, rank: 'x' } })).toBeNull()
  })
})

describe('the confrontation', () => {
  it('accepts only the evidence in the defence table', () => {
    expect(objectionHolds('DP-1', 'EV-14')).toBe(true)
    expect(objectionHolds('DP-1', 'EV-15')).toBe(true)
    expect(objectionHolds('DP-1', 'EV-03')).toBe(false)
    expect(objectionHolds('DP-5', 'EV-11')).toBe(true)
  })
  it('every point can be answered with core evidence the player will hold', () => {
    const ids = new Set(CASE_001.evidence.filter((e) => e.relevance !== 'optional').map((e) => e.id))
    for (const p of DEFENCE_POINTS) expect(p.accepts.some((id) => ids.has(id))).toBe(true)
  })
  it('grades the case without touching the score', () => {
    expect(trialGrade(0)).toBe('Flawless')
    expect(trialGrade(2)).toBe('Convincing')
    expect(trialGrade(5)).toBe('Shaky')
  })
})

describe('the entity', () => {
  it('hands out Clara\u2019s memories in order', () => {
    expect(nextFragment({ fragments: [] })?.id).toBe('CF-1')
    expect(nextFragment({ fragments: ['CF-1', 'CF-2'] })?.id).toBe('CF-3')
    expect(nextFragment({ fragments: CLARA_FRAGMENTS.map((f) => f.id) })).toBeNull()
  })
  it('remembers how it was treated', () => {
    const base = { answered: 0, ignored: 0, sawLilysRoom: true, margaretTrust: 50, fragments: 0 }
    expect(entityMemoryLine({ ...base, ignored: 3 })).toMatch(/Just like her/)
    expect(entityMemoryLine({ ...base, answered: 3 })).toMatch(/answered every time/)
    expect(entityMemoryLine({ ...base, sawLilysRoom: false })).toMatch(/her room/)
    expect(entityMemoryLine({ ...base, margaretTrust: 10 })).toMatch(/hard on her/)
    expect(memoryLine(state({ calls: { 'CALL-1': 'ignored', 'CALL-2': 'ignored' } }))).toMatch(/Just like her/)
  })
  it('ends kindly only for those who answered or listened', () => {
    expect(endingKind(state())).toBe('quiet')
    expect(endingKind(state({ calls: { 'CALL-1': 'answered', 'CALL-2': 'answered' } }))).toBe('answered')
    expect(endingKind(state({ fragments: ['CF-1', 'CF-2', 'CF-3', 'CF-4'] }))).toBe('answered')
  })
  it('calls at 11:13 on the player\u2019s clock, morning or night', () => {
    expect(isElevenThirteen(new Date(2026, 9, 31, 23, 13))).toBe(true)
    expect(isElevenThirteen(new Date(2026, 9, 31, 11, 13))).toBe(true)
    expect(isElevenThirteen(new Date(2026, 9, 31, 23, 14))).toBe(false)
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe("Reed's hints", () => {
  it('points at the next thing to show a witness, then contradictions, then links', () => {
    const s = state({ collectedEvidence: held(['EV-11']), revealedFacts: ['M1', 'M2'] })
    expect(partnerHint(s, CASE_001)).toMatch(/Telephone Company Ledger/)
    const done = state({ collectedEvidence: held(['EV-01', 'EV-11']), revealedFacts: CASE_001.witnesses.flatMap((w) => w.facts.map((f) => f.id)), contradictionsFlagged: CASE_001.contradictions.map((c) => c.id) })
    expect(partnerHint(done, CASE_001)).toMatch(/Rotary Telephone/)
  })
})
