import { firstUnsaid } from './leads'

export type FallbackLines = { greeting: string[]; unknown: string[]; evasive: string[]; pressure: string[] }
export type FallbackMood = 'calm' | 'afraid' | 'defensive' | 'cold'

/**
 * Choose an authored line that fits the moment when the model cannot be used.
 * After the greeting it prefers a lead (what to find or show next) or a memory the
 * witness has not said yet, so a scripted conversation still moves the case forward.
 */
export function pickFallback(
  lines: FallbackLines,
  ctx: {
    turns: number
    presented: boolean
    trust: number
    leads?: string[]
    details?: string[]
    /** The witness's earlier replies in this conversation */
    recent?: string[]
  }
): { line: string; mood: FallbackMood } {
  const kind: keyof FallbackLines =
    ctx.turns === 0 ? 'greeting'
      : ctx.presented ? 'evasive'
        : ctx.trust < 25 ? 'pressure'
          : ctx.turns % 2 === 0 ? 'evasive' : 'unknown'
  const pool = lines[kind].length > 0 ? lines[kind] : lines.unknown
  const authored = pool[ctx.turns % Math.max(1, pool.length)] ?? "I'm afraid I can't answer that."
  const mood: FallbackMood = kind === 'pressure' ? 'defensive' : kind === 'evasive' ? 'afraid' : 'calm'
  if (kind === 'greeting') return { line: authored, mood }

  const recent = ctx.recent ?? []
  const lead = firstUnsaid(ctx.leads ?? [], recent)
  // Shown the wrong thing: deflect, then point at what would matter
  if (ctx.presented) return { line: lead ? `${authored} ${lead}` : authored, mood }
  const fresh = lead ?? firstUnsaid(ctx.details ?? [], recent)
  if (fresh) return { line: fresh, mood: lead ? 'afraid' : 'calm' }
  const at = ctx.turns % Math.max(1, pool.length)
  return { line: firstUnsaid([...pool.slice(at), ...pool.slice(0, at)], recent) ?? authored, mood }
}
