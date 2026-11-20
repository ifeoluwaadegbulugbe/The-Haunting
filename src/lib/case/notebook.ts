import type { GameState } from '@/types'
import type { Case001 } from '@/data/case001'
import { evaluateCondition } from '@/lib/engine/conditions'
import { getAvailableContradictions } from '@/lib/evidence/contradictions'
import { NOTEBOOK_QUESTIONS } from '@/data/case001/notebook'

export interface Notebook {
  questions: Array<{ id: string; question: string; answer: string | null }>
  /** Contradictions the player holds both sides of */
  doubts: Array<{ id: string; text: string; confirmed: boolean }>
  /** Most recent finds, newest first */
  recent: Array<{ id: string; name: string }>
  foundCount: number
}

/** Pure: what the investigator would have written down so far. */
export function buildNotebook(state: GameState, caseData: Case001): Notebook {
  const questions = NOTEBOOK_QUESTIONS.map((q) => ({
    id: q.id,
    question: q.question,
    answer: evaluateCondition(q.answeredWhen, state) ? q.answer : null,
  }))

  const doubts = getAvailableContradictions(state, caseData).map((cx) => ({
    id: cx.id,
    text: cx.explanation,
    confirmed: state.contradictionsFlagged.includes(cx.id),
  }))

  const found = Object.entries(state.collectedEvidence).sort(([, a], [, b]) => b.at - a.at)
  const recent = found.slice(0, 6).map(([id]) => ({
    id,
    name: caseData.evidence.find((e) => e.id === id)?.name ?? id,
  }))

  return { questions, doubts, recent, foundCount: found.length }
}
