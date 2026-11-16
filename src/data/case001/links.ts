import { z } from 'zod'
import { LinkRuleSchema } from '@/types'
import type { LinkRule } from '@/types'

export const LINK_RULES: LinkRule[] = [
  {
    a: 'EV-01',
    b: 'EV-11',
    type: 'supports',
    explanation:
      'The telephone label "Ext 2 — Cellar" identifies the line that made the 23:13 call recorded in the ledger.',
  },
  {
    a: 'EV-01',
    b: 'EV-09',
    type: 'supports',
    explanation:
      "Lily's drawing shows two figures underground; the Ext 2 label confirms a cellar extension exists.",
  },
  {
    a: 'EV-02',
    b: 'EV-05',
    type: 'supports',
    explanation:
      'The photograph strip is the piece torn from the family photograph — they form a single image.',
  },
  {
    a: 'EV-05',
    b: 'EV-14',
    type: 'supports',
    explanation:
      "The photograph strip places Julian at Ashworth House in 2007; EV-14 places his car there on the night of the murder.",
  },
  {
    a: 'EV-06',
    b: 'EV-07',
    type: 'supports',
    explanation:
      'The recording captures the argument about the will amendment — the unsigned document.',
  },
  {
    a: 'EV-06',
    b: 'EV-10',
    type: 'supports',
    explanation:
      "Julian's debt gives him clear motive for the will amendment naming him heir.",
  },
  {
    a: 'EV-07',
    b: 'EV-14',
    type: 'timeline',
    explanation:
      "The recording proves an argument on the night of 11 November; the photograph confirms Julian was present that evening.",
  },
  {
    a: 'EV-08',
    b: 'EV-13',
    type: 'supports',
    explanation:
      "The logbook proves Dorothea left at 16:55, so Julian's email instructing her to say the family 'left before dark' is a fabricated alibi.",
  },
  {
    a: 'EV-12',
    b: 'EV-07',
    type: 'timeline',
    explanation:
      "Clara's voicemail at 22:50 places her alive and in the house before the argument; the recording begins at 23:05.",
  },
  {
    a: 'EV-03',
    b: 'EV-06',
    type: 'supports',
    explanation:
      "The diary records Edmund repeatedly refusing Julian's requests for money — establishing the motive behind the unsigned will.",
  },
  {
    a: 'EV-11',
    b: 'EV-12',
    type: 'timeline',
    explanation:
      "Two calls originate from Ashworth House on the night: Clara's voicemail at 22:50 and the cellar call at 23:13.",
  },
  {
    a: 'EV-13',
    b: 'EV-15',
    type: 'timeline',
    explanation:
      "Julian emails Dorothea the cover story at 07:12 on 12 November, then posts about boarding to Lisbon at 11:02 — his actions after the murder.",
  },
  {
    a: 'EV-X1',
    b: 'EV-08',
    type: 'contradicts',
    explanation:
      "The logbook proves Dorothea was not at the house after 16:55, disproving the disturbed photograph that appears to show her at the window at 23:00.",
  },
]

// Validate at import time
z.array(LinkRuleSchema).parse(LINK_RULES)
