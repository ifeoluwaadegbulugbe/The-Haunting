import { z } from 'zod'
import { DigitalRecordSchema } from '@/types'
import type { DigitalRecord } from '@/types'

export const DIGITAL_RECORDS: DigitalRecord[] = [
  // ── Evidence-yielding records ──────────────────────────────────────────────

  {
    id: 'DR-telco',
    device: 'telco',
    kind: 'call',
    timestamp: '2008-11-11',
    deleted: false,
    yieldsEvidence: 'EV-11',
    content: {
      header: 'ASHWORTH RESIDENCE — HOLLOW LANE — ACCOUNT REF 4471-B',
      entries: [
        {
          date: '11 Nov 2008',
          time: '21:12',
          from: 'Julian Ashworth mobile',
          to: 'Ashworth House main line',
          duration: '3m 14s',
          notes: '',
        },
        {
          date: '11 Nov 2008',
          time: '23:13',
          from: 'Ext 2 (Cellar)',
          to: 'Margaret Hale — Hollow Lane',
          duration: '41s',
          notes: 'UNANSWERED',
          highlighted: true,
        },
      ],
    },
  },
  {
    id: 'DR-photo',
    device: 'mobile',
    kind: 'photo',
    timestamp: '2008-11-11T22:31:00',
    deleted: false,
    yieldsEvidence: 'EV-14',
    content: {
      caption: 'Photo — 11/11/2008 22:31',
      description:
        "Taken by Edmund's mobile. Shows a car in the drive and a figure at the porch.",
      assetPath: '/assets/evidence/photo-car-drive.png',
    },
  },
  {
    id: 'DR-profile',
    device: 'mobile',
    kind: 'profile',
    timestamp: '2008-11-12T11:02:00',
    deleted: false,
    yieldsEvidence: 'EV-15',
    content: {
      platform: 'Social network (cached)',
      user: 'Julian Ashworth',
      status: 'Boarding to Lisbon.',
      postedAt: '12 Nov 2008 — 11:02',
    },
  },
  {
    id: 'DR-voicemail',
    device: 'laptop',
    kind: 'voicemail',
    timestamp: '2008-11-11T22:50:00',
    deleted: true,
    recoveryCondition: {
      allOf: [{ type: 'hasEvidence', ref: 'EV-04' }],
    },
    yieldsEvidence: 'EV-12',
    content: {
      from: 'Clara Ashworth',
      to: 'Beatrice (voicemail)',
      transcript:
        "Julian is here. Edmund won't let him in the study. I'll call you back.",
      duration: '14s',
    },
  },
  {
    id: 'DR-email',
    device: 'laptop',
    kind: 'email',
    timestamp: '2008-11-12T07:12:00',
    deleted: true,
    recoveryCondition: {
      allOf: [{ type: 'hasEvidence', ref: 'EV-08' }],
    },
    yieldsEvidence: 'EV-13',
    content: {
      from: 'julian.ashworth@email.com',
      to: 'dorothea.pryce@email.com',
      subject: '(no subject)',
      body: 'They left before dark. Say it exactly like that. Envelope on Thursday.',
    },
  },

  // ── Texture records (yield no evidence — give atmosphere) ─────────────────

  {
    id: 'DR-txt-01',
    device: 'mobile',
    kind: 'sms',
    timestamp: '2008-11-10T09:14:00',
    deleted: false,
    content: {
      from: 'Clara',
      to: 'Edmund',
      text: "Don't forget Lily's show is at 4. She's very anxious.",
    },
  },
  {
    id: 'DR-txt-02',
    device: 'mobile',
    kind: 'sms',
    timestamp: '2008-11-08T18:45:00',
    deleted: false,
    content: {
      from: 'Edmund',
      to: 'Clara',
      text: 'Running late. Start without me.',
    },
  },
  {
    id: 'DR-txt-03',
    device: 'mobile',
    kind: 'sms',
    timestamp: '2008-11-05T11:02:00',
    deleted: false,
    content: {
      from: 'Unknown',
      to: 'Edmund',
      text: "Service reminder: your boiler inspection is due. Call 0800 441 221.",
    },
  },
  {
    id: 'DR-email-01',
    device: 'laptop',
    kind: 'email',
    timestamp: '2008-11-07T14:33:00',
    deleted: false,
    content: {
      from: 'tesco.deliveries@tesco.co.uk',
      to: 'clara.ashworth@email.com',
      subject: 'Your Tesco delivery — Friday 7 Nov',
      body: 'Your grocery delivery is confirmed for Friday 7 November between 2pm and 4pm.',
    },
  },
  {
    id: 'DR-email-02',
    device: 'laptop',
    kind: 'email',
    timestamp: '2008-11-04T09:00:00',
    deleted: false,
    content: {
      from: 'hollowlane.primary@school.gov.uk',
      to: 'clara.ashworth@email.com',
      subject: 'Class 2 — Autumn Concert',
      body: "Dear Mrs Ashworth, please note that Lily's class concert is on Friday 14 November at 15:30.",
    },
  },
  {
    id: 'DR-note-01',
    device: 'laptop',
    kind: 'note',
    timestamp: '2008-10-30T20:15:00',
    deleted: false,
    content: {
      title: 'Shopping list',
      body: 'Milk, bread, candles (the tall ones), Lily crayons, Edmund — birthday card.',
    },
  },
  {
    id: 'DR-note-02',
    device: 'laptop',
    kind: 'note',
    timestamp: '2008-11-01T11:00:00',
    deleted: false,
    content: {
      title: 'Aunt Beatrice visit',
      body: 'B. arriving 22nd. Put clean sheets in the spare room. Edmund — fix the gate latch.',
    },
  },
  {
    id: 'DR-txt-04',
    device: 'mobile',
    kind: 'sms',
    timestamp: '2008-11-09T16:20:00',
    deleted: false,
    content: {
      from: 'Clara',
      to: 'Edmund',
      text: 'Julian called again. He sounded different this time. Please ring him back so he stops calling here.',
    },
  },
  {
    id: 'DR-photo-02',
    device: 'mobile',
    kind: 'photo',
    timestamp: '2008-10-31T15:45:00',
    deleted: false,
    content: {
      caption: 'Photo — 31/10/2008 15:45',
      description: "Lily in her Halloween costume on the front step. Clara's shadow visible.",
      assetPath: null,
    },
  },
  {
    id: 'DR-call-01',
    device: 'mobile',
    kind: 'call',
    timestamp: '2008-11-10T08:55:00',
    deleted: false,
    content: {
      from: 'Edmund',
      to: 'Dr. Marsh surgery',
      duration: '2m 03s',
      notes: 'Routine appointment',
    },
  },
]

// Validate at import time
z.array(DigitalRecordSchema).parse(DIGITAL_RECORDS)
