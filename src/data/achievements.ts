import type { GameState } from '@/types'
import { CASE_001 } from '@/data/case001'
import { FORENSIC_TASKS } from '@/data/case001/forensics'
import { CLARA_FRAGMENTS } from '@/data/case001/story'

export interface Achievement {
  id: string
  title: string
  description: string
  earned: (s: GameState) => boolean
}

/** Every optional hidden detail in the case (OC-*), read from the case data */
export const OPTIONAL = CASE_001.evidence.filter((e) => e.relevance === 'optional').map((e) => e.id)
export const OPTIONAL_TOTAL = OPTIONAL.length
const CALL_IDS = ['CALL-1', 'CALL-2', 'CALL-3']
const has = (s: GameState, id: string) => Boolean(s.collectedEvidence[id])

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-clue',
    title: 'First Clue',
    description: 'Recover your first piece of evidence.',
    earned: (s) => Object.keys(s.collectedEvidence).length > 0,
  },
  {
    id: 'no-stone',
    title: 'No Stone Unturned',
    description: 'Examine every object in the study.',
    earned: (s) => CASE_001.scene.every((o) => s.inspectedObjects.includes(o.id)),
  },
  {
    id: 'sharp-eye',
    title: 'Sharp Eye',
    description: 'Find every hidden detail.',
    earned: (s) => OPTIONAL.every((id) => has(s, id)),
  },
  {
    id: 'archivist',
    title: 'Archivist',
    description: 'Log every record that matters in the Digital Archives.',
    earned: (s) => ['EV-11', 'EV-12', 'EV-13', 'EV-14', 'EV-15'].every((id) => has(s, id)),
  },
  {
    id: 'every-secret',
    title: 'Every Secret',
    description: 'Draw out every fact the three witnesses were hiding.',
    earned: (s) => ['M4', 'M5', 'M6', 'D3', 'D4', 'D5', 'J4', 'J5'].every((f) => s.revealedFacts.includes(f)),
  },
  {
    id: 'lie-detector',
    title: 'Lie Detector',
    description: 'Confirm all seven contradictions.',
    earned: (s) => CASE_001.contradictions.every((c) => s.contradictionsFlagged.includes(c.id)),
  },
  {
    id: 'you-looked',
    title: 'You Looked',
    description: 'Expose the entity\u2019s forgery.',
    earned: (s) => s.contradictionsFlagged.includes('CX-07'),
  },
  {
    id: 'web',
    title: 'Red String',
    description: 'Make every true connection on the evidence board.',
    earned: (s) => s.links.filter((l) => l.verdict === 'valid').length >= 12,
  },
  {
    id: 'clockwork',
    title: 'Clockwork',
    description: 'Reconstruct the final night in the right order.',
    earned: (s) => (s.verdict?.breakdown.timeline ?? 0) === 20,
  },
  {
    id: 'answered',
    title: 'Someone Answered',
    description: 'Pick up every 11:13 call.',
    earned: (s) => CALL_IDS.every((id) => s.calls?.[id] === 'answered'),
  },
  {
    id: 'nursery',
    title: 'By Torchlight',
    description: 'Search Lily\u2019s room.',
    earned: (s) => has(s, 'OC-05') && has(s, 'OC-06'),
  },
  {
    id: 'keen-eye',
    title: 'Keen Eye',
    description: 'Earn five stars in a room search.',
    earned: (s) => Object.values(s.search ?? {}).some((r) => r.stars >= 5),
  },
  {
    id: 'forensic',
    title: 'Bench Work',
    description: 'Finish every task in the forensics lab.',
    earned: (s) => FORENSIC_TASKS.every((t) => (s.forensics ?? []).includes(t.id)),
  },
  {
    id: 'her-voice',
    title: 'Her Last Hour',
    description: 'Find all six of Clara\u2019s memories.',
    earned: (s) => (s.fragments ?? []).length >= CLARA_FRAGMENTS.length,
  },
  {
    id: 'on-time',
    title: 'On Time',
    description: 'Be playing when your own clock reads 11:13.',
    earned: (s) => (s.clockEvents ?? []).length > 0,
  },
  {
    id: 'cross-examined',
    title: 'Cross-Examined',
    description: 'Break Julian\u2019s defence without a single wrong answer.',
    earned: (s) => s.trial?.mistakes === 0,
  },
  {
    id: 'master',
    title: 'Master of the Archive',
    description: 'Close Case 001 with a perfect score.',
    earned: (s) => s.verdict?.score === 100,
  },
]

export function thoroughness(s: GameState): number {
  return OPTIONAL.filter((id) => has(s, id)).length
}
