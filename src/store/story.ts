/** Story state derived from game state: chapters, the confrontation, the entity's memory. */
import type { GameState } from '@/types'
import { CHAPTERS, DEFENCE_POINTS, CLARA_FRAGMENTS, entityMemoryLine, type Chapter } from '@/data/case001/story'
import { evaluateCondition } from '@/lib/engine/conditions'
import { selectUnlockedSections } from './selectors'
import { LILY_ROOM_OBJECTS } from '@/data/case001/lily-room'

export function chapterClosed(ch: Chapter, s: GameState): boolean {
  if (typeof ch.closesWhen === 'string') return selectUnlockedSections(s)[ch.closesWhen]
  return evaluateCondition(ch.closesWhen, s)
}

/** The chapter the player is in: the first one not yet closed (null once all are). */
export function currentChapter(s: GameState): Chapter | null {
  return CHAPTERS.find((c) => !chapterClosed(c, s)) ?? null
}

/** A closed chapter whose ending has not been shown yet. */
export function pendingChapterEnd(s: GameState): Chapter | null {
  if (s.verdict) return null
  return CHAPTERS.find((c) => chapterClosed(c, s) && !(s.seenCinematics ?? []).includes(c.id)) ?? null
}

/** Is this evidence an answer to that point of Julian's defence? */
export function objectionHolds(pointId: string, evidenceId: string): boolean {
  return DEFENCE_POINTS.find((p) => p.id === pointId)?.accepts.includes(evidenceId) ?? false
}

/** How the confrontation went, from the number of wrong answers. */
export function trialGrade(mistakes: number): string {
  if (mistakes === 0) return 'Flawless'
  if (mistakes <= 2) return 'Convincing'
  return 'Shaky'
}

/** The next of Clara's fragments not yet found (null when all are). */
export function nextFragment(s: Pick<GameState, 'fragments'>) {
  return CLARA_FRAGMENTS.find((f) => !(s.fragments ?? []).includes(f.id)) ?? null
}

/** What the entity remembers about how it was treated. */
export function memoryLine(s: GameState): string {
  const calls = Object.values(s.calls ?? {})
  return entityMemoryLine({
    answered: calls.filter((c) => c === 'answered').length,
    ignored: calls.filter((c) => c === 'ignored').length,
    sawLilysRoom: LILY_ROOM_OBJECTS.some((o) => s.inspectedObjects.includes(o.id)),
    margaretTrust: s.witnessTrust.margaret ?? 50,
    fragments: (s.fragments ?? []).length,
  })
}

/** How the cellar ending goes. It never changes the score. */
export function endingKind(s: GameState): 'answered' | 'quiet' {
  const answered = Object.values(s.calls ?? {}).filter((c) => c === 'answered').length
  return answered >= 2 || (s.fragments ?? []).length >= 4 ? 'answered' : 'quiet'
}

/**
 * A specific hint from Archivist Reed (costs a star). Read from the case data:
 * the next earned fact and what unlocks it, then an unconfirmed contradiction, then a missing link.
 */
export function partnerHint(s: GameState, caseData: import('@/data/case001').Case001): string {
  const name = (id: string) => caseData.evidence.find((e) => e.id === id)?.name ?? id
  for (const w of caseData.witnesses) {
    for (const f of w.facts) {
      if (s.revealedFacts.includes(f.id)) continue
      const checks = [...(f.revealWhen.anyOf ?? []), ...(f.revealWhen.allOf ?? [])]
      const shown = checks.find((c) => c.type === 'presentedEvidence')
      if (!shown) continue
      const evId = String(shown.ref).split(':').pop()!
      if (!s.collectedEvidence[evId]) continue
      return `Show ${w.name} the ${name(evId)}. It will change what ${w.name.split(' ')[0]} is willing to say.`
    }
  }
  const held = (id: string) => Boolean(s.collectedEvidence[id])
  const open = caseData.contradictions.find((c) => !s.contradictionsFlagged.includes(c.id) && held(c.b) && (held(c.a) || c.a.startsWith('ST-')))
  if (open) return `Something doesn\u2019t add up about the ${name(open.b)}. Compare it with what was said, then challenge it.`
  const link = caseData.links.find((l) => l.type !== 'contradicts' && held(l.a) && held(l.b) && !s.links.some((x) => (x.a === l.a && x.b === l.b) || (x.a === l.b && x.b === l.a)))
  if (link) return `On the board, try the ${name(link.a)} with the ${name(link.b)}.`
  return 'You have what you need. Put the night in order on the timeline and name them.'
}
