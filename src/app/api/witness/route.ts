import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { CASE_001 } from '@/data/case001'
import { getProvider } from '@/lib/ai/witness/provider'
import { resolveWitnessTurn } from '@/lib/ai/witness/resolver'
import { buildWitnessPrompt } from '@/lib/ai/witness/prompt-builder'
import { validateReply } from '@/lib/ai/witness/validator'
import { pickFallback } from '@/lib/ai/witness/fallback'

// ── Request schema ─────────────────────────────────────────────────────────

const WitnessRequestSchema = z.object({
  witnessId: z.enum(['julian', 'margaret', 'dorothea']),
  message: z.string().min(1).max(300),
  presentedEvidenceId: z.string().optional(),
  snapshot: z.object({
    collectedEvidenceIds: z.array(z.string()).max(50),
    revealedFactIds: z.array(z.string()).max(50),
    presentedEvidenceIds: z.array(z.string()).max(50).default([]),
    trust: z.number().min(0).max(100),
    recentTurns: z.array(z.object({
      role: z.enum(['player', 'witness']),
      text: z.string().max(400),
    })).max(8),
  }),
})

// Two model calls of up to 12 s each must fit inside the serverless time limit
export const maxDuration = 30

// ── In-memory rate limiter ─────────────────────────────────────────────────

const rateLimits = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 12
const WINDOW_MS = 60_000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimits.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

// ── POST handler ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Body size guard
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > 4096) {
    return NextResponse.json({ error: 'Request too large' }, { status: 400 })
  }

  // Parse and validate
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = WitnessRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
  }

  const { witnessId, message, presentedEvidenceId, snapshot } = parsed.data

  // Rate limit
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '0.0.0.0'
  if (!checkRateLimit(ip)) {
    const witness = CASE_001.witnesses.find((w) => w.id === witnessId)!
    return NextResponse.json({
      reply: witness.fallbackLines.pressure[0],
      usedFactIds: [],
      newlyRevealed: [],
      trustDelta: 0,
      mood: 'defensive',
      fallback: true,
    })
  }

  // Find witness
  const witness = CASE_001.witnesses.find((w) => w.id === witnessId)
  if (!witness) {
    return NextResponse.json({ error: 'Unknown witness' }, { status: 400 })
  }

  // Resolve facts deterministically
  const resolverInput = { witnessId, presentedEvidenceId, snapshot: { ...snapshot, recentTurns: [...snapshot.recentTurns, { role: 'player' as const, text: message }] } }
  const resolverOutput = resolveWitnessTurn(resolverInput, witness, CASE_001)
  const { allowedFacts, lockedFacts, trustDelta, revealGuarantee } = resolverOutput

  const allowedFactIds = allowedFacts.map((f) => f.id)

  // Find presented evidence detail
  const presentedEvidence = presentedEvidenceId
    ? CASE_001.evidence.find((e) => e.id === presentedEvidenceId)
    : undefined

  // Build prompt
  const prompt = buildWitnessPrompt(witness, resolverOutput, snapshot.recentTurns, presentedEvidence, message)

  // Call provider with timeout
  let raw = ''
  let providerFailed = false
  const provider = getProvider()

  try {
    // Room for models that think before answering; the reply itself is capped at 70 words
    raw = await provider.complete(prompt, { temperature: 0.6, maxTokens: 1024, json: true })
  } catch (e) {
    providerFailed = true
    logFailure(witnessId, 'provider', e)
  }

  // Validate reply; retry once if failed
  let validatedReply = providerFailed ? null : validateReply(raw, allowedFactIds, lockedFacts)

  if (!providerFailed && validatedReply && !validatedReply.ok) {
    // Retry with stricter suffix
    const strictPrompt = prompt + '\n\nREMINDER: Return ONLY valid JSON. No text outside the JSON object.'
    try {
      const raw2 = await provider.complete(strictPrompt, { temperature: 0.3, maxTokens: 1024, json: true })
      validatedReply = validateReply(raw2, allowedFactIds, lockedFacts)
      if (!validatedReply.ok) logFailure(witnessId, 'validation', validatedReply.reason)
    } catch (e) {
      providerFailed = true
      logFailure(witnessId, 'provider-retry', e)
    }
  }

  // Fallback if still not valid
  if (providerFailed || !validatedReply?.ok) {
    const { line: fallbackReply, mood: fallbackMood } = pickFallback(witness.fallbackLines, {
      turns: snapshot.recentTurns.filter((t) => t.role === 'player').length,
      presented: Boolean(presentedEvidenceId),
      trust: snapshot.trust,
    })
    const newlyRevealed = buildRevealGuarantee(revealGuarantee)
    const fullReply = newlyRevealed.length > 0
      ? `${fallbackReply} ${newlyRevealed.map((r) => r.statement).join(' ')}`
      : fallbackReply

    return NextResponse.json({
      reply: fullReply,
      usedFactIds: [],
      newlyRevealed,
      trustDelta,
      mood: fallbackMood,
      fallback: true,
    })
  }

  // Build guarantee lines
  const usedFactIds = validatedReply.reply!.usedFactIds
  const newlyRevealed = buildRevealGuarantee(
    revealGuarantee.filter((f) => !usedFactIds.includes(f.id))
  )

  // Append guarantee to reply if needed
  const finalReply = newlyRevealed.length > 0
    ? `${validatedReply.reply!.reply} ${newlyRevealed.map((r) => r.statement).join(' ')}`
    : validatedReply.reply!.reply

  return NextResponse.json({
    reply: finalReply,
    usedFactIds: [...usedFactIds, ...newlyRevealed.map((r) => r.factId)],
    newlyRevealed,
    trustDelta,
    mood: validatedReply.reply!.mood,
  })
}

/** Server log only: why a scripted line was used. Never the key, the prompt or the player's message. */
function logFailure(witnessId: string, stage: string, detail: unknown) {
  const reason = detail instanceof Error
    ? (detail.name === 'AbortError' ? 'timeout' : detail.message)
    : String(detail)
  console.warn(`[witness] ${witnessId} ${stage} failed: ${reason.slice(0, 120)}`)
}

function buildRevealGuarantee(facts: Array<{ id: string; statement: string; yieldsStatementId?: string }>) {
  return facts.map((f) => ({
    factId: f.id,
    statementId: f.yieldsStatementId,
    statement: f.statement,
  }))
}
