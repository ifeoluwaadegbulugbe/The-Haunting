import type { GameState } from '@/types'
import { FORENSIC_TASKS, PROFILE_TRAITS, SUSPECT_TRAITS, type ForensicTask } from '@/data/case001/forensics'

type S = Pick<GameState, 'collectedEvidence' | 'revealedFacts' | 'forensics' | 'lab'>

export type TaskStatus = 'locked' | 'open' | 'in-lab' | 'ready' | 'done'

/** Where a forensic task stands right now. */
export function taskStatus(task: ForensicTask, s: S, now = Date.now()): TaskStatus {
  const done = s.forensics ?? []
  if (done.includes(task.id)) return 'done'
  if (!task.needs.every((id) => s.collectedEvidence[id])) return 'locked'
  const readyAt = s.lab?.[task.id]
  if (readyAt !== undefined) return now >= readyAt ? 'ready' : 'in-lab'
  return 'open'
}

/** Seconds until a lab result is ready (0 if ready or not in the lab). */
export function labSecondsLeft(taskId: string, s: S, now = Date.now()): number {
  const readyAt = s.lab?.[taskId]
  return readyAt === undefined ? 0 : Math.max(0, Math.ceil((readyAt - now) / 1000))
}

export function traitKnown(traitId: string, s: S): boolean {
  const t = PROFILE_TRAITS.find((x) => x.id === traitId)
  if (!t) return false
  return Boolean(
    t.from.evidence?.some((id) => s.collectedEvidence[id]) ||
    t.from.facts?.some((id) => s.revealedFacts.includes(id)) ||
    t.from.forensics?.some((id) => (s.forensics ?? []).includes(id))
  )
}

export interface SuspectMatch { id: string; matches: number; known: number; fits: boolean }

/** How each suspect measures against the traits known so far. */
export function suspectMatches(s: S): SuspectMatch[] {
  const known = PROFILE_TRAITS.filter((t) => traitKnown(t.id, s)).map((t) => t.id)
  return Object.entries(SUSPECT_TRAITS).map(([id, traits]) => {
    const matches = known.filter((t) => traits.includes(t)).length
    return { id, matches, known: known.length, fits: known.length > 0 && matches === known.length }
  })
}

export const FORENSIC_COUNT = FORENSIC_TASKS.length
