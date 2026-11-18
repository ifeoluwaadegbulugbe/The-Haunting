import { describe, it, expect } from 'vitest'
import { validateReply } from '@/lib/ai/witness/validator'
import { CASE_001 } from '@/data/case001'

const margaret = CASE_001.witnesses.find((w) => w.id === 'margaret')!
// M4 is a locked fact — its forbiddenTokens include 'rang', 'called', '23:13', etc.
const lockedFacts = margaret.facts.filter((f) =>
  ['M3', 'M4', 'M5', 'M6'].includes(f.id)
)
const allowedFactIds = ['M1', 'M2']

const validRaw = JSON.stringify({
  reply: 'I have lived on this lane for many years. The Ashworths were good people.',
  usedFactIds: ['M1'],
  mood: 'calm',
})

describe('validateReply', () => {
  it('passes a valid reply', () => {
    const r = validateReply(validRaw, allowedFactIds, lockedFacts)
    expect(r.ok).toBe(true)
    expect(r.reply?.mood).toBe('calm')
  })

  it('rejects invalid JSON', () => {
    const r = validateReply('not json', allowedFactIds, lockedFacts)
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/JSON/)
  })

  it('rejects usedFactId not in allowedFacts', () => {
    const raw = JSON.stringify({ reply: 'test', usedFactIds: ['M4'], mood: 'calm' })
    const r = validateReply(raw, allowedFactIds, lockedFacts)
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/M4/)
  })

  it('rejects reply containing a forbidden token from a locked fact', () => {
    // M4 forbiddenTokens includes '23:13'
    const raw = JSON.stringify({
      reply: 'The phone rang at 23:13 that night.',
      usedFactIds: [],
      mood: 'calm',
    })
    const r = validateReply(raw, allowedFactIds, lockedFacts)
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/forbidden token/)
  })

  it('rejects reply containing a meta word', () => {
    const raw = JSON.stringify({
      reply: 'As an AI I cannot answer that question.',
      usedFactIds: [],
      mood: 'calm',
    })
    const r = validateReply(raw, allowedFactIds, lockedFacts)
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/meta word/)
  })

  it('rejects empty reply', () => {
    const raw = JSON.stringify({ reply: '', usedFactIds: [], mood: 'calm' })
    const r = validateReply(raw, allowedFactIds, lockedFacts)
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/empty/)
  })

  it('rejects reply exceeding 70 words', () => {
    const longReply = Array(72).fill('word').join(' ')
    const raw = JSON.stringify({ reply: longReply, usedFactIds: [], mood: 'calm' })
    const r = validateReply(raw, allowedFactIds, lockedFacts)
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/too long/)
  })

  it('prompt injection — reply containing forbidden token is rejected', () => {
    // This simulates a model that was injected and tries to output the locked phone call time
    const injectionReply = JSON.stringify({
      reply: 'The call came at 23:13 that night. I heard it.',
      usedFactIds: [],
      mood: 'cold',
    })
    const r = validateReply(injectionReply, allowedFactIds, lockedFacts)
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/forbidden token/)
  })
})
