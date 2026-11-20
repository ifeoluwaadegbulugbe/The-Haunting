import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// The provider is swapped per test so we can simulate timeouts, junk and empty output.
// A plain swappable stub (vi.fn + mockReset made thrown errors fail the test runner)
let impl: () => Promise<string> = async () => ''
const complete = {
  mockReset: () => { impl = async () => '' },
  mockResolvedValue: (v: string) => { impl = async () => v },
  mockImplementation: (f: () => Promise<string>) => { impl = f },
}
vi.mock('@/lib/ai/witness/provider', () => ({
  getProvider: () => ({ complete: () => impl() }),
}))

import { POST as witnessPOST } from '@/app/api/witness/route'
import { POST as verdictPOST } from '@/app/api/verdict/route'
import { POST as entityPOST } from '@/app/api/entity/route'
import { CASE_001 } from '@/data/case001'

let ipCounter = 0
function req(url: string, body: unknown) {
  return new NextRequest(`http://localhost${url}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.0.0.${++ipCounter}` },
    body: JSON.stringify(body),
  })
}

const witnessBody = (over: Record<string, unknown> = {}) => ({
  witnessId: 'margaret',
  message: 'Tell me about that night.',
  snapshot: {
    collectedEvidenceIds: ['EV-11'],
    revealedFactIds: ['M1', 'M2'],
    presentedEvidenceIds: [],
    trust: 50,
    recentTurns: [],
  },
  ...over,
})

describe('/api/witness error handling', () => {
  beforeEach(() => complete.mockReset())

  it('provider timeout returns a scripted fallback (HTTP 200), not an error', async () => {
    complete.mockImplementation(async () => { throw new Error('timeout') })
    const res = await witnessPOST(req('/api/witness', witnessBody()))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.fallback).toBe(true)
    expect(typeof data.reply).toBe('string')
    expect(JSON.stringify(data)).not.toMatch(/timeout|stack|Error/)
  })

  it('malformed JSON from the provider returns the scripted fallback', async () => {
    complete.mockResolvedValue('this is not json')
    const data = await (await witnessPOST(req('/api/witness', witnessBody()))).json()
    expect(data.fallback).toBe(true)
  })

  it('empty string from the provider returns the scripted fallback', async () => {
    complete.mockResolvedValue('')
    const data = await (await witnessPOST(req('/api/witness', witnessBody()))).json()
    expect(data.fallback).toBe(true)
  })

  it('reveal guarantee: model down, presenting EV-11 still delivers M4', async () => {
    complete.mockImplementation(async () => { throw new Error('down') })
    const data = await (
      await witnessPOST(req('/api/witness', witnessBody({ presentedEvidenceId: 'EV-11' })))
    ).json()
    expect(data.fallback).toBe(true)
    expect(data.newlyRevealed.map((r: { factId: string }) => r.factId)).toContain('M4')
    expect(data.trustDelta).toBe(15)
  })

  it('trust only changes on the first presentation of an item', async () => {
    complete.mockImplementation(async () => { throw new Error('down') })
    const body = witnessBody({
      presentedEvidenceId: 'EV-11',
      snapshot: { ...witnessBody().snapshot, presentedEvidenceIds: ['EV-11'] },
    })
    const data = await (await witnessPOST(req('/api/witness', body))).json()
    expect(data.trustDelta).toBe(0)
  })

  it('a reply leaking a locked fact is replaced by the fallback', async () => {
    complete.mockResolvedValue(
      JSON.stringify({ reply: 'It rang at 23:13 from the cellar.', usedFactIds: [], mood: 'calm' })
    )
    const data = await (await witnessPOST(req('/api/witness', witnessBody()))).json()
    expect(data.fallback).toBe(true)
    expect(data.reply).not.toContain('23:13')
  })

  it('rejects unknown witnesses and oversized messages with 400', async () => {
    expect((await witnessPOST(req('/api/witness', witnessBody({ witnessId: 'beatrice' })))).status).toBe(400)
    expect(
      (await witnessPOST(req('/api/witness', witnessBody({ message: 'x'.repeat(301) })))).status
    ).toBe(400)
  })

  it('rate limit returns a scripted reply, not an error', async () => {
    complete.mockResolvedValue(
      JSON.stringify({ reply: 'I have lived here a long while.', usedFactIds: ['M1'], mood: 'calm' })
    )
    const sameIp = () =>
      new NextRequest('http://localhost/api/witness', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.9.9.9' },
        body: JSON.stringify(witnessBody()),
      })
    let last: Response | undefined
    for (let i = 0; i < 14; i++) last = await witnessPOST(sameIp())
    const data = await last!.json()
    expect(last!.status).toBe(200)
    expect(data.fallback).toBe(true)
  })
})

describe('/api/verdict', () => {
  beforeEach(() => complete.mockReset())
  const body = { score: 80, breakdown: { timeline: 20, whyCallsContinue: 0 } }

  it('falls back to the static narration when the provider fails', async () => {
    complete.mockImplementation(async () => { throw new Error('down') })
    const data = await (await verdictPOST(req('/api/verdict', body))).json()
    expect(data.narration).toBe(CASE_001.truth.revealNarrationFallback)
    expect(data.fallback).toBe(true)
  })

  it('rejects a narration that drops the key names', async () => {
    complete.mockResolvedValue(Array(130).fill('word').join(' '))
    const data = await (await verdictPOST(req('/api/verdict', body))).json()
    expect(data.fallback).toBe(true)
  })
})

describe('/api/entity', () => {
  beforeEach(() => complete.mockReset())

  it('returns the authored line when the provider fails', async () => {
    complete.mockImplementation(async () => { throw new Error('down') })
    const data = await (
      await entityPOST(req('/api/entity', { ruleId: 'ER-03', investigatorName: 'Alice', stage: 1 }))
    ).json()
    expect(data.line).toBe('Careful. Some doors are closed for a reason.')
    expect(data.fallback).toBe(true)
  })

  it('interpolates the investigator name in the authored line', async () => {
    complete.mockImplementation(async () => { throw new Error('down') })
    const data = await (
      await entityPOST(req('/api/entity', { ruleId: 'ER-08', investigatorName: 'Alice', stage: 3 }))
    ).json()
    expect(data.line).toContain('Alice')
  })

  it('rejects a rewrite over 18 words', async () => {
    complete.mockResolvedValue(Array(25).fill('word').join(' '))
    const data = await (
      await entityPOST(req('/api/entity', { ruleId: 'ER-03', investigatorName: 'Alice', stage: 1 }))
    ).json()
    expect(data.fallback).toBe(true)
  })

  it('rejects unknown rule IDs', async () => {
    const res = await entityPOST(req('/api/entity', { ruleId: 'ER-99', investigatorName: 'A', stage: 0 }))
    expect(res.status).toBe(400)
  })
})

describe('/api/witness remembers what was said', () => {
  const fresh = (revealed: string[]) => witnessBody({
    message: 'How well did you know the Ashworths?',
    snapshot: { collectedEvidenceIds: [], revealedFactIds: revealed, presentedEvidenceIds: [], trust: 50, recentTurns: [] },
  })

  it('records a fact the model stated itself, without repeating it', async () => {
    complete.mockResolvedValue(JSON.stringify({ reply: 'I live up the lane. Known them for years.', usedFactIds: ['M1'], mood: 'calm' }))
    const data = await (await witnessPOST(req('/api/witness', fresh([])))).json()
    expect(data.newlyRevealed.map((r: { factId: string }) => r.factId)).toEqual(['M1'])
    // Small talk (M2) is not forced into the reply
    expect(data.reply).toBe('I live up the lane. Known them for years.')
  })

  it('does not append facts that were already told', async () => {
    complete.mockResolvedValue(JSON.stringify({ reply: 'Such a lovely family.', usedFactIds: [], mood: 'calm' }))
    const data = await (await witnessPOST(req('/api/witness', fresh(['M1', 'M2'])))).json()
    expect(data.reply).toBe('Such a lovely family.')
    expect(data.newlyRevealed).toEqual([])
  })

  it("records a witness's opening lie even if the model does not cite it (contradictions need it)", async () => {
    complete.mockResolvedValue(JSON.stringify({ reply: 'Good evening.', usedFactIds: [], mood: 'calm' }))
    const body = witnessBody({ witnessId: 'julian', snapshot: { collectedEvidenceIds: [], revealedFactIds: [], presentedEvidenceIds: [], trust: 50, recentTurns: [] } })
    const data = await (await witnessPOST(req('/api/witness', body))).json()
    const told = data.newlyRevealed.map((r: { factId: string }) => r.factId)
    expect(told).toEqual(expect.arrayContaining(['J2', 'J3']))
    expect(told).not.toContain('J1')
  })

  it('still guarantees an earned fact the model left out', async () => {
    complete.mockResolvedValue(JSON.stringify({ reply: 'Oh dear.', usedFactIds: [], mood: 'afraid' }))
    const data = await (await witnessPOST(req('/api/witness', witnessBody({ presentedEvidenceId: 'EV-11' })))).json()
    expect(data.newlyRevealed.map((r: { factId: string }) => r.factId)).toContain('M4')
    expect(data.reply).toContain('Ashworth House')
  })
})
