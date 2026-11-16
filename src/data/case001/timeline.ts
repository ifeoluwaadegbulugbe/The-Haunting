import { z } from 'zod'
import { TimelineEventSchema } from '@/types'
import type { TimelineEvent } from '@/types'

export const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: 'TL-01',
    order: 1,
    time: '11 Nov, 16:55',
    label: 'Dorothea clocks out and leaves the house',
  },
  {
    id: 'TL-02',
    order: 2,
    time: '21:40',
    label: 'Julian arrives at the house',
  },
  {
    id: 'TL-03',
    order: 3,
    time: '22:50',
    label: 'Clara leaves a voicemail for Aunt Beatrice',
  },
  {
    id: 'TL-04',
    order: 4,
    time: '23:05',
    label: 'Edmund refuses to sign; argument is recorded',
    requires: ['TL-02'],
  },
  {
    id: 'TL-05',
    order: 5,
    time: '23:09',
    label: 'Edmund is killed; Clara and Lily are locked in the cellar',
    requires: ['TL-04'],
  },
  {
    id: 'TL-06',
    order: 6,
    time: '23:13',
    label: 'Clara calls Margaret from the cellar extension; no answer',
    requires: ['TL-05'],
  },
  {
    id: 'TL-07',
    order: 7,
    time: '12 Nov, 07:12',
    label: 'Julian emails Dorothea the cover story and arranges payment',
    requires: ['TL-05'],
  },
]

// Validate at import time
z.array(TimelineEventSchema).parse(TIMELINE_EVENTS)
