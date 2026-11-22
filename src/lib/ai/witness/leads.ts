import type { Witness, WitnessFact } from '@/types'

/**
 * Leads for the facts this witness is still holding back: the first two locked facts
 * (in authored order) that have leads. Chosen by code; the model only phrases them.
 */
export function currentLeads(witness: Witness, lockedFacts: WitnessFact[]): string[] {
  const locked = new Set(lockedFacts.map((f) => f.id))
  return witness.facts
    .filter((f) => locked.has(f.id) && (f.leads?.length ?? 0) > 0)
    .slice(0, 2)
    .flatMap((f) => f.leads ?? [])
}

const words = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean)

function trigrams(s: string): string[] {
  const w = words(s)
  const out: string[] = []
  for (let i = 0; i + 2 < w.length; i++) out.push(`${w[i]} ${w[i + 1]} ${w[i + 2]}`)
  return out
}

/**
 * True when a reply mostly restates one of the witness's earlier replies
 * (at least 45% of its three-word runs already appeared in a single earlier reply).
 */
export function isRepeat(reply: string, earlierReplies: string[]): boolean {
  const mine = trigrams(reply)
  if (mine.length === 0) return earlierReplies.some((e) => words(e).join(' ') === words(reply).join(' '))
  return earlierReplies.some((earlier) => {
    const seen = new Set(trigrams(earlier))
    const shared = mine.filter((t) => seen.has(t)).length
    return shared / mine.length >= 0.45
  })
}

/** The first line from `candidates` that the witness has not already said. */
export function firstUnsaid(candidates: string[], earlierReplies: string[]): string | undefined {
  const said = earlierReplies.map((e) => words(e).join(' '))
  return candidates.find((c) => {
    const n = words(c).join(' ')
    return !said.some((s) => s.includes(n))
  })
}
