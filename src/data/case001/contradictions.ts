import { z } from 'zod'
import { ContradictionRuleSchema } from '@/types'
import type { ContradictionRule } from '@/types'

export const CONTRADICTION_RULES: ContradictionRule[] = [
  {
    id: 'CX-01',
    a: 'ST-M-DENY',
    b: 'EV-11',
    severity: 'major',
    explanation:
      'Margaret denies receiving any call that night, but the telephone company ledger ' +
      'records an outgoing call from Ext 2 (Cellar) to her number at 23:13 on 11 November 2008.',
  },
  {
    id: 'CX-02',
    a: 'ST-D-LEFT',
    b: 'EV-12',
    severity: 'major',
    explanation:
      "Dorothea claims the family drove away before dark, but the recovered voicemail " +
      "proves Clara was alive and in the house at 22:50 — well after dark.",
  },
  {
    id: 'CX-03',
    a: 'ST-J-ABROAD',
    b: 'EV-14',
    severity: 'major',
    explanation:
      "Julian claims he was in Lisbon from 10 November, but a photograph from Edmund's " +
      "mobile phone shows Julian's car at Ashworth House at 22:31 on 11 November 2008.",
  },
  {
    id: 'CX-04',
    a: 'ST-J-ABROAD',
    b: 'EV-15',
    severity: 'major',
    explanation:
      "Julian claims he was in Lisbon from 10 November, but his social media post " +
      'reads "Boarding to Lisbon" on 12 November — the day after the murder.',
  },
  {
    id: 'CX-05',
    a: 'ST-J-EMIGRATE',
    b: 'EV-03',
    severity: 'minor',
    explanation:
      "Julian claims Edmund and Clara were planning to emigrate, but Clara's diary " +
      'contains no mention of any such plan.',
  },
  {
    id: 'CX-06',
    a: 'EV-04',
    b: 'EV-14',
    severity: 'minor',
    explanation:
      "The newspaper clippings state Julian was abroad at the time of the disappearance, " +
      "but the photograph from Edmund's mobile proves Julian was at the house that evening.",
  },
  {
    id: 'CX-07',
    a: 'EV-X1',
    b: 'EV-08',
    severity: 'major',
    explanation:
      "The disturbed photograph appears to show Dorothea at the study window at 23:00, " +
      "but the housekeeper's logbook proves she clocked out at 16:55 and was never there. " +
      'The photograph is manipulated.',
  },
]

// Validate at import time
z.array(ContradictionRuleSchema).parse(CONTRADICTION_RULES)
