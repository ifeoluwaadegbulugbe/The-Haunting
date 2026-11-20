import { z } from 'zod'
import { MoodSchema } from '@/types'
import type { WitnessFact } from '@/types'

export const WitnessReplySchema = z.object({
  reply: z.string(),
  usedFactIds: z.array(z.string()),
  mood: MoodSchema,
})

export type WitnessReply = z.infer<typeof WitnessReplySchema>

export function validateReply(
  raw: string,
  allowedFactIds: string[],
  lockedFacts: WitnessFact[],
  /** Statements of the allowed facts. Words they contain may be said even if a locked fact also lists them. */
  allowedStatements: string[] = []
): { ok: boolean; reply?: WitnessReply; reason?: string } {
  const wordIn = (word: string, text: string) =>
    new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)
  const allowedText = allowedStatements.join(' ')
  // 1. JSON parse + schema
  let parsed: WitnessReply
  try {
    const unfenced = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    parsed = WitnessReplySchema.parse(JSON.parse(unfenced))
  } catch {
    return { ok: false, reason: 'JSON parse or schema failure' }
  }

  // 2. usedFactIds must be a subset of allowedFactIds
  for (const id of parsed.usedFactIds) {
    if (!allowedFactIds.includes(id)) {
      return { ok: false, reason: `usedFactId "${id}" not in allowedFacts` }
    }
  }

  // 3. No forbidden tokens from locked facts (whole-word match)
  for (const fact of lockedFacts) {
    for (const token of fact.forbiddenTokens) {
      if (!token || wordIn(token, allowedText)) continue
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const tokenRegex = new RegExp(`\\b${escaped}\\b`, 'i')
      if (tokenRegex.test(parsed.reply)) {
        return { ok: false, reason: `forbidden token "${token}" from locked fact ${fact.id}` }
      }
    }
  }

  // 4. No meta words (whole-word match)
  if (/\b(ai|model|prompt|game|instructions)\b/i.test(parsed.reply)) {
    const matched = parsed.reply.match(/\b(ai|model|prompt|game|instructions)\b/i)?.[0]
    return { ok: false, reason: `meta word "${matched}" in reply` }
  }

  // 5. Length: not empty, ≤ 70 words
  const wordCount = parsed.reply.trim().split(/\s+/).filter(Boolean).length
  if (wordCount === 0) return { ok: false, reason: 'empty reply' }
  if (wordCount > 70) return { ok: false, reason: `reply too long (${wordCount} words)` }

  return { ok: true, reply: parsed }
}
