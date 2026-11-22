import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { CASE_001 } from '@/data/case001'
import { getProvider } from '@/lib/ai/witness/provider'
import { resolveWitnessTurn } from '@/lib/ai/witness/resolver'
import { buildWitnessPrompt } from '@/lib/ai/witness/prompt-builder'
import { validateReply } from '@/lib/ai/witness/validator'
import { pickFallback } from '@/lib/ai/witness/fallback'
import { currentLeads, isRepeat } from '@/lib/ai/witness/leads'

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
  const allowedStatements = allowedFacts.map((f) => f.statement)

  // Find presented evidence detail
  const presentedEvidence = presentedEvidenceId
    ? CASE_001.evidence.find((e) => e.id === presentedEvidenceId)
    : undefined

  // Build prompt
  const prompt = buildWitnessPrompt(witness, resolverOutput, snapshot.recentTurns, presentedEvidence, message, snapshot.revealedFactIds)

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

  // Validate reply; retry once if failed. A reply that restates an earlier one also fails,
  // so the conversation keeps moving instead of circling the same sentence.
  const earlierReplies = snapshot.recentTurns.filter((t) => t.role === 'witness').map((t) => t.text)
  const check = (text: string) => {
    const v = validateReply(text, allowedFactIds, lockedFacts, allowedStatements)
    if (v.ok && isRepeat(v.reply!.reply, earlierReplies)) return { ok: false, reason: 'repeats an earlier reply' } as typeof v
    return v
  }
  let validatedReply = providerFailed ? null : check(raw)

  if (!providerFailed && validatedReply && !validatedReply.ok) {
    // Retry with stricter suffix
    const strictPrompt = prompt + (validatedReply.reason === 'repeats an earlier reply'
      ? '\n\nREMINDER: You already said that. Say something new: give one LEAD or one MEMORY in your own words. Return ONLY valid JSON.'
      : '\n\nREMINDER: Return ONLY valid JSON. No text outside the JSON object.')
    try {
      const raw2 = await provider.complete(strictPrompt, { temperature: 0.7, maxTokens: 1024, json: true })
      validatedReply = check(raw2)
      if (!validatedReply.ok) logFailure(witnessId, 'validation', validatedReply.reason)
    } catch (e) {
      providerFailed = true
      logFailure(witnessId, 'provider-retry', e)
    }
  }

  // Fallback if still not valid
  if (providerFailed || !validatedReply?.ok) {
    // When this turn already tells something new, the scripted line stays short: no lead on top
    const toldNow = revealGuarantee.some(mustBeTold)
    const { line: fallbackReply, mood: fallbackMood } = pickFallback(witness.fallbackLines, {
      turns: snapshot.recentTurns.filter((t) => t.role === 'player').length,
      presented: Boolean(presentedEvidenceId),
      trust: snapshot.trust,
      leads: toldNow ? [] : currentLeads(witness, lockedFacts),
      details: witness.details,
      recent: earlierReplies,
    })
    // Facts that must be told are guaranteed; small talk waits for a real reply
    const newlyRevealed = buildRevealGuarantee(revealGuarantee.filter(mustBeTold))
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

  const usedFactIds = validatedReply.reply!.usedFactIds
  // Reveal guarantee: a fact that must be told and that the model left out is added as its authored line.
  // Facts that are always available are small talk; they are never forced into a reply.
  const appended = revealGuarantee.filter((f) => mustBeTold(f) && !usedFactIds.includes(f.id))
  // Everything newly told this turn is recorded, whether the model said it or the guarantee
  // added it. Otherwise the same fact is treated as new, and repeated, on every turn.
  const newlyRevealed = buildRevealGuarantee(
    revealGuarantee.filter((f) => usedFactIds.includes(f.id) || appended.includes(f))
  )

  const finalReply = appended.length > 0
    ? `${validatedReply.reply!.reply} ${appended.map((f) => f.statement).join(' ')}`
    : validatedReply.reply!.reply

  return NextResponse.json({
    reply: finalReply,
    usedFactIds: [...new Set([...usedFactIds, ...appended.map((f) => f.id)])],
    newlyRevealed,
    trustDelta,
    mood: validatedReply.reply!.mood,
  })
}

/**
 * A fact the player must be told: one they earned (evidence, trust or another fact), or a
 * statement the case depends on, such as a lie that a contradiction is built on.
 * Everything else is small talk and is never forced into a reply.
 */
function mustBeTold(f: { revealWhen: { allOf?: unknown[]; anyOf?: unknown[] }; yieldsStatementId?: string }) {
  return (f.revealWhen.allOf?.length ?? 0) > 0 || (f.revealWhen.anyOf?.length ?? 0) > 0 || Boolean(f.yieldsStatementId)
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
