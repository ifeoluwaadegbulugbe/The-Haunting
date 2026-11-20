import type { Condition } from '@/types'

/**
 * The investigator's notebook: open questions that write their own answers as the
 * player finds things. Every answer restates evidence the player already holds.
 */
export interface NotebookQuestion {
  id: string
  question: string
  answeredWhen: Condition
  answer: string
}

export const NOTEBOOK_QUESTIONS: NotebookQuestion[] = [
  {
    id: 'NQ-calls',
    question: 'Who is calling at 11:13?',
    answeredWhen: { allOf: [{ type: 'hasEvidence', ref: 'EV-11' }] },
    answer: 'The ledger: Ext 2, the cellar line, rang Margaret Hale at 23:13.',
  },
  {
    id: 'NQ-left',
    question: 'Did the family really leave before dark?',
    answeredWhen: { allOf: [{ type: 'hasEvidence', ref: 'EV-12' }] },
    answer: 'No. Clara left a voicemail from the house at 22:50.',
  },
  {
    id: 'NQ-julian',
    question: 'Where was Julian that night?',
    answeredWhen: { allOf: [{ type: 'hasEvidence', ref: 'EV-14' }] },
    answer: 'At the house. His car was in the drive at 22:31.',
  },
  {
    id: 'NQ-motive',
    question: 'What did Julian want from Edmund?',
    answeredWhen: { allOf: [{ type: 'hasEvidence', ref: 'EV-06' }] },
    answer: 'A signature on a will naming Julian as heir. Edmund never signed.',
  },
  {
    id: 'NQ-2309',
    question: 'What happened in the study at 23:09?',
    answeredWhen: { allOf: [{ type: 'hasEvidence', ref: 'EV-07' }] },
    answer: 'The recording: "You\u2019ll sign it, Edmund." A crash. Then silence.',
  },
  {
    id: 'NQ-margaret',
    question: 'Why did Margaret never answer?',
    answeredWhen: { allOf: [{ type: 'hasFact', ref: 'M5' }] },
    answer: 'She saw it was the house calling, and Julian\u2019s car was in the drive.',
  },
  {
    id: 'NQ-dorothea',
    question: 'Why would Dorothea lie to the police?',
    answeredWhen: { allOf: [{ type: 'hasFact', ref: 'D4' }] },
    answer: 'Julian paid her to say the family left.',
  },
  {
    id: 'NQ-where',
    question: 'Where did Ext 2 ring from?',
    answeredWhen: { allOf: [{ type: 'hasEvidence', ref: 'EV-01' }, { type: 'hasEvidence', ref: 'EV-09' }] },
    answer: 'The label says Cellar. Lily drew two people below the ground.',
  },
]
