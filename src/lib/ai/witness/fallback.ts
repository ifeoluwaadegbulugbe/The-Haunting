export type FallbackLines = { greeting: string[]; unknown: string[]; evasive: string[]; pressure: string[] }
export type FallbackMood = 'calm' | 'afraid' | 'defensive' | 'cold'

/**
 * Choose an authored line that fits the moment when the model cannot be used,
 * rotating through the lines so the witness does not repeat itself every turn.
 */
export function pickFallback(
  lines: FallbackLines,
  ctx: { turns: number; presented: boolean; trust: number }
): { line: string; mood: FallbackMood } {
  const kind: keyof FallbackLines =
    ctx.turns === 0 ? 'greeting'
      : ctx.presented ? 'evasive'
        : ctx.trust < 25 ? 'pressure'
          : ctx.turns % 2 === 0 ? 'evasive' : 'unknown'
  const pool = lines[kind].length > 0 ? lines[kind] : lines.unknown
  const line = pool[ctx.turns % Math.max(1, pool.length)] ?? "I'm afraid I can't answer that."
  const mood: FallbackMood = kind === 'pressure' ? 'defensive' : kind === 'evasive' ? 'afraid' : 'calm'
  return { line, mood }
}
