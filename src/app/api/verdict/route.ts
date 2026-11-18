import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { CASE_001 } from '@/data/case001'
import { getProvider } from '@/lib/ai/witness/provider'
import { allowRequest } from '@/lib/ai/rate-limit'

/**
 * Narration only. The score and breakdown are already computed by the scoring
 * engine. The model may adjust tone; the facts come from truth.ts. Any failure
 * returns the static authored narration.
 */

const MAX: Record<string, number> = {
  culpritAndWhatHappened: 25,
  timeline: 20,
  evidenceInterpretation: 20,
  witnessReliability: 15,
  whyCallsContinue: 10,
  manipulatedEvidence: 10,
}

const RequestSchema = z.object({
  score: z.number().min(0).max(100),
  breakdown: z.record(z.number()),
})

// A narration must still name the people and the key times; otherwise it is rejected
const REQUIRED = ['Julian', 'Edmund', 'Clara', 'Margaret', 'Dorothea']
const BANNED = /\b(ai|model|prompt|game|instructions)\b/i

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const staticReply = NextResponse.json({
    narration: CASE_001.truth.revealNarrationFallback,
    fallback: true,
  })

  if (process.env.AI_MOCK === '1') return staticReply
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '0.0.0.0'
  if (!allowRequest(`verdict:${ip}`, 6)) return staticReply

  const { score, breakdown } = parsed.data
  const right = Object.keys(MAX).filter((k) => (breakdown[k] ?? 0) === MAX[k])
  const wrong = Object.keys(MAX).filter((k) => (breakdown[k] ?? 0) < MAX[k])

  const prompt =
    `Narrate the solution of a gothic mystery in 120 to 160 words, in a calm, sombre voice.\n` +
    `Use ONLY the facts below. Do not change any name, time or event, and do not add new ones.\n` +
    `TRUE ACCOUNT: ${CASE_001.truth.fiveAnswers.whatHappenedFinalNight}\n` +
    `WHY IT STILL RINGS: ${CASE_001.truth.entityIdentity}\n` +
    `The investigator scored ${score} out of 100. Got right: ${right.join(', ') || 'nothing'}. ` +
    `Missed: ${wrong.join(', ') || 'nothing'}.\n` +
    `Return only the narration text.`

  try {
    const text = (await getProvider().complete(prompt, { temperature: 0.6, maxTokens: 400 })).trim()
    const words = text.split(/\s+/).filter(Boolean).length
    const hasNames = REQUIRED.every((n) => text.includes(n))
    if (words < 100 || words > 180 || !hasNames || BANNED.test(text)) return staticReply
    return NextResponse.json({ narration: text })
  } catch {
    return staticReply
  }
}
