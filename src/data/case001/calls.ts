import type { Condition } from '@/types'

/**
 * The 11:13 calls (truth file §9.10, "Incoming calls"). The study extension rings the
 * investigator at three fixed moments. The player answers or lets it ring.
 * Effects are fixed: answering lowers the entity's attention, ignoring raises it.
 * A call never changes evidence, facts, unlocks or the score.
 */
export interface IncomingCallDef {
  id: string
  /** When the call comes */
  when: Condition
  /** What the investigator hears on the line, shown as text (no voice) */
  heard: string
  /** The entity's message if the call is left to ring */
  ignoredLine: string
}

export const CALL_ANSWER_ATTENTION = -5
export const CALL_IGNORE_ATTENTION = 5
/** Seconds the phone rings before it counts as ignored */
export const CALL_RING_SECONDS = 20

export const INCOMING_CALLS: IncomingCallDef[] = [
  {
    id: 'CALL-1',
    when: { allOf: [{ type: 'hasEvidence', ref: 'EV-01' }, { type: 'hasEvidence', ref: 'EV-07' }] },
    heard: 'Static. Then, very close to the mouthpiece, someone breathing. The line goes dead.',
    ignoredLine: 'It rang for a long time.',
  },
  {
    id: 'CALL-2',
    when: { allOf: [{ type: 'hasEvidence', ref: 'EV-12' }] },
    heard: 'A woman, far away: \u201c\u2026is someone there? It\u2019s so cold down here\u2026\u201d Then only the dial tone.',
    ignoredLine: 'You heard her voice. You still did not answer.',
  },
  {
    id: 'CALL-3',
    when: { allOf: [{ type: 'hasFact', ref: 'M4' }] },
    heard: '\u201c\u2026you picked up. No one ever picks up.\u201d A long breath, almost a sob. Then nothing.',
    ignoredLine: 'Just like her. Just like everyone.',
  },
]
