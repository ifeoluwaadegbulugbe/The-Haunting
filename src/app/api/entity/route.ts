import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { CASE_001 } from '@/data/case001'
import { getProvider } from '@/lib/ai/witness/provider'
import { allowRequest } from '@/lib/ai/rate-limit'

/**
 * Optional flavour only. The rule table has already decided WHAT the entity does;
 * this route may only rephrase the authored line. Any failure returns the authored line.
 */

const RequestSchema = z.object({
  ruleId: z.string().max(10),
  investigatorName: z.string().max(40).regex(/^[\p{L}\p{N} .'-]*$/u).default('Investigator'),
  lastItem: z.string().max(60).optional(),
  stage: z.number().int().min(0).max(4),
})

const BANNED = /\b(ai|model|prompt|game|instructions)\b/i

function authored(ruleId: string, name: string): string {
  const rule = CASE_001.entityRules.find((r) => r.id === ruleId)
  return (rule?.lines[0] ?? '').replace(/\{name\}/g, name || 'Investigator')
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { ruleId, investigatorName, lastItem, stage } = parsed.data
  if (!CASE_001.entityRules.some((r) => r.id === ruleId)) {
    return NextResponse.json({ error: 'Unknown rule' }, { status: 400 })
  }

  const base = authored(ruleId, investigatorName)
  const fallback = NextResponse.json({ line: base, fallback: true })

  // Nothing to rephrase, mock mode, or rate limited: use the authored line
  if (!base || process.env.AI_MOCK === '1') return fallback
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '0.0.0.0'
  if (!allowRequest(`entity:${ip}`, 6)) return fallback

  const prompt =
    `You write one line for a quiet, grieving ghost in a gothic mystery.\n` +
    `Rewrite this line in the same meaning and tone. One sentence, at most 18 words. ` +
    `Do not add new facts, names or times. Return only the sentence.\n` +
    `Line: ${base}\n` +
    `Investigator: ${investigatorName}\n` +
    (lastItem ? `Last item they found: ${lastItem}\n` : '') +
    `Ghost stage: ${stage} of 4`

  try {
    const raw = (await getProvider().complete(prompt, { temperature: 0.7, maxTokens: 60 })).trim()
    const line = raw.replace(/^["']|["']$/g, '')
    const words = line.split(/\s+/).filter(Boolean).length
    if (!line || words > 18 || BANNED.test(line) || /\n/.test(line)) return fallback
    return NextResponse.json({ line })
  } catch {
    return fallback
  }
}
