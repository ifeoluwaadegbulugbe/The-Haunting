import { describe, it, expect, afterEach, vi } from 'vitest'
import { pickFallback } from '@/lib/ai/witness/fallback'
import { getProvider, MockProvider } from '@/lib/ai/witness/provider'
import { CASE_001 } from '@/data/case001'
import { buildWitnessPrompt } from '@/lib/ai/witness/prompt-builder'
import { resolveWitnessTurn } from '@/lib/ai/witness/resolver'

const margaret = CASE_001.witnesses.find((w) => w.id === 'margaret')!
const lines = margaret.fallbackLines

describe('pickFallback', () => {
  it('greets on the first turn', () => {
    expect(lines.greeting).toContain(pickFallback(lines, { turns: 0, presented: false, trust: 50 }).line)
  })

  it('is evasive when evidence is presented and defensive under pressure', () => {
    expect(lines.evasive).toContain(pickFallback(lines, { turns: 3, presented: true, trust: 50 }).line)
    const p = pickFallback(lines, { turns: 3, presented: false, trust: 10 })
    expect(lines.pressure).toContain(p.line)
    expect(p.mood).toBe('defensive')
  })

  it('does not give the same line on consecutive turns', () => {
    const seen = new Set([1, 2, 3, 4].map((turns) => pickFallback(lines, { turns, presented: false, trust: 50 }).line))
    expect(seen.size).toBeGreaterThan(1)
  })
})

describe('buildWitnessPrompt', () => {
  it("puts the investigator's new message under USER, not the witness's last line", () => {
    const out = resolveWitnessTurn(
      { witnessId: 'margaret', snapshot: { collectedEvidenceIds: [], revealedFactIds: [], presentedEvidenceIds: [], trust: 50, recentTurns: [] } },
      margaret, CASE_001,
    )
    const prompt = buildWitnessPrompt(margaret, out, [{ role: 'witness', text: 'Good evening.' }], undefined, 'Does your phone ring at night?')
    expect(prompt.split('USER:')[1].trim()).toBe('Does your phone ring at night?')
  })
})

describe('getProvider', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('uses the mock when AI_MOCK=1', () => {
    vi.stubEnv('AI_MOCK', '1')
    expect(getProvider()).toBeInstanceOf(MockProvider)
  })

  it('fails safely (scripted lines) when no model is configured', async () => {
    vi.stubEnv('AI_MOCK', '0')
    vi.stubEnv('AI_API_KEY', 'x')
    vi.stubEnv('AI_MODEL', '')
    await expect(getProvider().complete('hi', { temperature: 0, maxTokens: 10 })).rejects.toThrow()
  })
})
