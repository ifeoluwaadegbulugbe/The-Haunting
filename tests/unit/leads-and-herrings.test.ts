import { describe, it, expect } from 'vitest'
import { CASE_001 } from '@/data/case001'
import { validateReply } from '@/lib/ai/witness/validator'
import { currentLeads, isRepeat, firstUnsaid } from '@/lib/ai/witness/leads'
import { pickFallback } from '@/lib/ai/witness/fallback'
import { resolveWitnessTurn } from '@/lib/ai/witness/resolver'
import { buildWitnessPrompt } from '@/lib/ai/witness/prompt-builder'
import { laptopHintAt, laptopHintLevel, LAPTOP_HINTS } from '@/lib/engine/puzzles'
import { selectProgress } from '@/store/selectors'
import type { WitnessFact } from '@/types'

const witness = (id: string) => CASE_001.witnesses.find((w) => w.id === id)!
const always = (f: WitnessFact) => !(f.revealWhen.allOf?.length || f.revealWhen.anyOf?.length)

/** Would the validator accept this line when every gated fact is still locked? */
function passesWhenLocked(witnessId: string, text: string) {
  const w = witness(witnessId)
  const allowed = w.facts.filter(always)
  const locked = w.facts.filter((f) => !always(f))
  return validateReply(
    JSON.stringify({ reply: text, usedFactIds: [], mood: 'calm' }),
    allowed.map((f) => f.id), locked, allowed.map((f) => f.statement)
  )
}

describe('witness leads, memories and suspicions', () => {
  for (const w of CASE_001.witnesses) {
    it(`${w.name}: every authored line passes the leak check with all gated facts locked`, () => {
      const lines = [...(w.details ?? []), ...(w.suspicions ?? []), ...w.facts.flatMap((f) => f.leads ?? [])]
      expect(lines.length).toBeGreaterThan(5)
      for (const line of lines) expect(passesWhenLocked(w.id, line), line).toMatchObject({ ok: true })
    })
    it(`${w.name}: every gated fact has a lead pointing the way`, () => {
      for (const f of w.facts.filter((x) => !always(x) && x.id !== 'J6')) expect(f.leads?.length, f.id).toBeGreaterThan(0)
    })
  }

  it('offers leads for the next locked facts only, and none once they are told', () => {
    const m = witness('margaret')
    const start = resolveWitnessTurn({ witnessId: 'margaret', snapshot: { collectedEvidenceIds: [], revealedFactIds: [], trust: 50, recentTurns: [] } }, m, CASE_001)
    const leads = currentLeads(m, start.lockedFacts)
    expect(leads.join(' ')).toMatch(/camera|photograph/i) // M3 lead: Edmund's photos
    expect(leads.join(' ')).toMatch(/telephone company/i) // M4 lead: the ledger
    const prompt = buildWitnessPrompt(m, start, [], undefined, 'How well did you know them?', [])
    expect(prompt).toContain('LEADS')
    expect(prompt).toContain(leads[0])
    // After EV-11 is shown the call (M4) and M5 unlock, so their leads drop away
    const later = resolveWitnessTurn({ witnessId: 'margaret', presentedEvidenceId: 'EV-11', snapshot: { collectedEvidenceIds: ['EV-11'], revealedFactIds: [], trust: 50, recentTurns: [] } }, m, CASE_001)
    expect(currentLeads(m, later.lockedFacts).join(' ')).not.toMatch(/telephone company/i)
  })

  it('spots the repeated answers from the reported transcript', () => {
    const first = 'I live just up the lane, you see. Four hundred metres or so. I have known the Ashworths for years, I suppose.'
    expect(isRepeat('I... well, I live just up the lane, you see. Four hundred metres or so. I have known the Ashworths for years, I suppose.', [first])).toBe(true)
    expect(isRepeat("Close to them? Well... yes, I suppose. I live just up the lane, you see. Four hundred metres or so, and I've known the Ashworths for years.", [first])).toBe(true)
    expect(isRepeat('Lily used to bring me her drawings on the way home from school.', [first])).toBe(false)
  })

  it('a scripted reply gives an unsaid lead instead of a dead end', () => {
    const m = witness('margaret')
    const leads = m.facts.find((f) => f.id === 'M3')!.leads!
    const a = pickFallback(m.fallbackLines, { turns: 3, presented: false, trust: 50, leads, details: m.details, recent: [] })
    expect(a.line).toBe(leads[0])
    const b = pickFallback(m.fallbackLines, { turns: 4, presented: false, trust: 50, leads, details: m.details, recent: [a.line] })
    expect(b.line).toBe(leads[1])
    const c = pickFallback(m.fallbackLines, { turns: 5, presented: false, trust: 50, leads, details: m.details, recent: [a.line, b.line] })
    expect(m.details).toContain(c.line)
    expect(firstUnsaid(['x y z'], ['and x y z here'])).toBeUndefined()
  })
})

describe("Clara's laptop hints", () => {
  it('can be asked for at any time and escalate to the answer', () => {
    expect(laptopHintLevel(0)).toBe(0)
    expect(laptopHintAt(1)).toMatch(/diary/)
    expect(laptopHintAt(2)).toMatch(/November entries/)
    expect(laptopHintAt(3)).toMatch(/14|concert/)
    expect(laptopHintAt(LAPTOP_HINTS.length)).toMatch(/lily14/)
  })
  it('sends the player to find the diary first if they do not have it', () => {
    expect(laptopHintAt(1, false)).toMatch(/diary in the study/)
  })
})

describe('red herrings (§9.14)', () => {
  const herrings = CASE_001.evidence.filter((e) => ['EV-16', 'EV-17', 'EV-18'].includes(e.id))
  it('are findable in the Digital Archives and answered by held evidence', () => {
    expect(herrings).toHaveLength(3)
    const ids = new Set(CASE_001.evidence.map((e) => e.id))
    for (const h of herrings) {
      expect(h.relevance).toBe('red-herring')
      expect(h.authenticity).toBe('misleading')
      expect(h.explanation).toBeTruthy()
      expect(CASE_001.digital.some((r) => r.yieldsEvidence === h.id && !r.deleted)).toBe(true)
      for (const r of h.refutedBy ?? []) expect(ids.has(r)).toBe(true)
    }
  })
  it('point at all three witnesses between them', () => {
    const pointed = new Set(herrings.flatMap((h) => h.relatedCharacters))
    for (const id of ['margaret', 'dorothea', 'clara']) expect(pointed.has(id)).toBe(true)
  })
  it('never count towards progress', () => {
    const base = { collectedEvidence: {}, contradictionsFlagged: [], links: [], revealedFacts: [], timelinePlacement: {} }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = (ids: string[]) => ({ ...base, collectedEvidence: Object.fromEntries(ids.map((i) => [i, { at: 0, flags: [] }])) }) as any
    expect(selectProgress(s(['EV-16', 'EV-17', 'EV-18']), CASE_001)).toBe(0)
  })
})
