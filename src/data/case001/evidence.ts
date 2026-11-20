import { z } from 'zod'
import { EvidenceSchema } from '@/types'
import type { Evidence } from '@/types'

export const EVIDENCE_ITEMS: Evidence[] = [
  {
    id: 'EV-01',
    name: 'Rotary Telephone',
    description:
      'An old rotary telephone mounted on the study wall. A faded label reads: ' +
      '"Ext 2 — Cellar." A second handset is listed on the same line.',
    kind: 'physical',
    source: 'OBJ-telephone',
    location: 'Study',
    reliability: 'high',
    authenticity: 'genuine',
    relevance: 'core',
    relatedCharacters: ['clara'],
    relatedEvents: ['TL-06'],
  },
  {
    id: 'EV-02',
    name: 'Torn Family Photograph',
    description:
      'A Christmas photograph from 2007. The family stands together — ' +
      'but a figure on the right edge has been torn away.',
    kind: 'photo',
    source: 'OBJ-photograph',
    location: 'Study',
    reliability: 'high',
    authenticity: 'genuine',
    relevance: 'supporting',
    relatedCharacters: ['edmund', 'clara', 'lily', 'julian'],
    relatedEvents: ['TL-02'],
    assetPath: '/assets/evidence/photo-family-torn.jpg',
  },
  {
    id: 'EV-03',
    name: "Clara's Diary",
    description:
      "Clara's leather-bound diary. Entries record Julian's repeated visits " +
      'and requests for money. The final pages have been torn out. ' +
      'A small key is taped inside the back cover.',
    kind: 'document',
    source: 'OBJ-diary',
    location: 'Study',
    reliability: 'high',
    authenticity: 'genuine',
    relevance: 'core',
    relatedCharacters: ['clara', 'julian'],
    relatedEvents: ['TL-02'],
  },
  {
    id: 'EV-04',
    name: 'Newspaper Clippings',
    description:
      'Three clippings about the case. The official account states the family ' +
      'left before dark and that Julian Ashworth was abroad at the time. ' +
      'Both claims are demonstrably false.',
    kind: 'document',
    source: 'OBJ-clippings',
    location: 'Study',
    reliability: 'medium',
    authenticity: 'misleading',
    relevance: 'supporting',
    relatedCharacters: ['julian', 'dorothea'],
    relatedEvents: ['TL-01'],
  },
  {
    id: 'EV-05',
    name: 'Photograph Strip',
    description:
      "The torn strip from EV-02. It shows Julian's hand on Lily's shoulder at Christmas 2007. " +
      'Julian has scratched his own face from the image.',
    kind: 'photo',
    source: 'OBJ-cabinet',
    location: 'Study cabinet',
    reliability: 'high',
    authenticity: 'genuine',
    relevance: 'core',
    relatedCharacters: ['julian', 'lily'],
    relatedEvents: ['TL-02'],
    assetPath: '/assets/evidence/photo-strip.jpg',
  },
  {
    id: 'EV-06',
    name: 'Unsigned Will Amendment',
    description:
      "A typed legal document naming Julian Ashworth as sole heir to Edmund's estate. " +
      "Edmund's signature line is blank.",
    kind: 'document',
    source: 'OBJ-cabinet',
    location: 'Study cabinet',
    reliability: 'high',
    authenticity: 'genuine',
    relevance: 'core',
    relatedCharacters: ['julian', 'edmund'],
    relatedEvents: ['TL-04'],
  },
  {
    id: 'EV-07',
    name: 'Final Night Recording',
    description:
      "An audio recording from Edmund's study recorder. Timestamp 23:05 to 23:09. " +
      "Julian's voice: \"You'll sign it, Edmund.\" A crash. Then silence.",
    kind: 'audio',
    source: 'OBJ-recorder',
    location: 'Study',
    reliability: 'high',
    authenticity: 'genuine',
    relevance: 'core',
    relatedCharacters: ['julian', 'edmund'],
    relatedEvents: ['TL-04', 'TL-05'],
  },
  {
    id: 'EV-08',
    name: "Housekeeper's Logbook",
    description:
      "Dorothea's work log. The entry for 11 November 2008 reads: 'Clocked out 16:55.' " +
      'A margin note reads: "Mr Julian asked to borrow the house key copies — 4 Nov."',
    kind: 'document',
    source: 'OBJ-clock',
    location: 'Behind the mantel clock',
    reliability: 'high',
    authenticity: 'genuine',
    relevance: 'core',
    relatedCharacters: ['dorothea', 'julian'],
    relatedEvents: ['TL-01', 'TL-07'],
  },
  {
    id: 'EV-09',
    name: "Lily's Drawing",
    description:
      'A crayon drawing by Lily Ashworth, dated 10 November 2008. ' +
      'It shows a car, a house, and two small figures standing below the floorline — ' +
      'underground.',
    kind: 'document',
    source: 'OBJ-belongings',
    location: "Lily's belongings",
    reliability: 'medium',
    authenticity: 'genuine',
    relevance: 'supporting',
    relatedCharacters: ['lily'],
    relatedEvents: ['TL-05'],
    assetPath: '/assets/evidence/drawing-lily.jpg',
  },
  {
    id: 'EV-10',
    name: 'Creditor Final Notice',
    description:
      "A final demand from a London credit firm, addressed to Julian Ashworth. " +
      "Dated October 2008. The sum is substantial. Julian's debt — and his motive.",
    kind: 'document',
    source: 'OBJ-rug',
    location: 'Under the study rug',
    reliability: 'high',
    authenticity: 'genuine',
    relevance: 'supporting',
    relatedCharacters: ['julian'],
    relatedEvents: ['TL-04'],
  },
  {
    id: 'EV-11',
    name: 'Telephone Company Ledger',
    description:
      'Official telephone records for the Ashworth House line. ' +
      'Two calls on the night of 11 November 2008: ' +
      '21:12 — Julian\'s mobile to house. ' +
      '23:13 — Ext 2 (Cellar) outgoing to Margaret Hale, 41 seconds, unanswered.',
    kind: 'callRecord',
    source: 'DR-telco',
    location: 'Digital Archives — Telephone Records',
    reliability: 'high',
    authenticity: 'genuine',
    relevance: 'core',
    relatedCharacters: ['clara', 'margaret', 'julian'],
    relatedEvents: ['TL-06'],
  },
  {
    id: 'EV-12',
    name: 'Recovered Voicemail',
    description:
      "A deleted voicemail recovered from Clara's laptop. Timestamp 22:50. " +
      "Clara to Beatrice: \"Julian is here. Edmund won't let him in the study. I'll call you back.\"",
    kind: 'audio',
    source: 'DR-voicemail',
    location: "Digital Archives — Clara's Laptop",
    reliability: 'high',
    authenticity: 'genuine',
    relevance: 'core',
    relatedCharacters: ['clara', 'julian'],
    relatedEvents: ['TL-03'],
  },
  {
    id: 'EV-13',
    name: 'Recovered Email',
    description:
      "A deleted email recovered from Clara's laptop. Sent 12 November 2008 at 07:12 " +
      'by Julian Ashworth to Dorothea Pryce: ' +
      '"They left before dark. Say it exactly like that. Envelope on Thursday."',
    kind: 'email',
    source: 'DR-email',
    location: "Digital Archives — Clara's Laptop (deleted)",
    reliability: 'high',
    authenticity: 'genuine',
    relevance: 'core',
    relatedCharacters: ['julian', 'dorothea'],
    relatedEvents: ['TL-07'],
  },
  {
    id: 'EV-14',
    name: 'Digital Photograph',
    description:
      "A photograph from Edmund's mobile phone. Timestamp 22:31. " +
      "It shows Julian's car parked in the drive with a figure at the front porch.",
    kind: 'photo',
    source: 'DR-photo',
    location: "Digital Archives — Edmund's Mobile",
    reliability: 'high',
    authenticity: 'genuine',
    relevance: 'core',
    relatedCharacters: ['julian'],
    relatedEvents: ['TL-02'],
    assetPath: '/assets/evidence/photo-car-drive.jpg',
  },
  {
    id: 'EV-15',
    name: "Julian's Social Profile",
    description:
      "A cached page from Edmund's mobile browser showing Julian's social media profile. " +
      'Status posted 12 November 2008 at 11:02: "Boarding to Lisbon."',
    kind: 'profile',
    source: 'DR-profile',
    location: "Digital Archives — Edmund's Mobile",
    reliability: 'medium',
    authenticity: 'genuine',
    relevance: 'supporting',
    relatedCharacters: ['julian'],
    relatedEvents: ['TL-07'],
  },
  {
    id: 'EV-X1',
    name: 'Disturbed Photograph',
    description:
      'A photograph that appears to show Dorothea Pryce standing at the study window ' +
      'at approximately 23:00 on 11 November 2008. The image metadata reveals the original ' +
      'was taken at Christmas 2003. The timestamp has been manipulated.',
    kind: 'photo',
    source: 'entity-planted',
    location: 'Evidence board — planted by the entity',
    reliability: 'low',
    authenticity: 'manipulated',
    relevance: 'red-herring',
    relatedCharacters: ['dorothea'],
    relatedEvents: [],
    refutedBy: ['EV-08'],
    assetPath: '/assets/evidence/photo-window-disturbed.jpg',
  },

  // ── Optional hidden clues ────────────────────────────────────────────────
  // Found by examining items closely. They reward thoroughness (rating and
  // achievements) but are never needed to progress and never change the score.
  {
    id: 'OC-01',
    name: 'Signet Ring',
    description:
      'Under magnification, the torn edge of the family photograph still shows a man\u2019s cuff ' +
      'and a gold signet ring engraved "J.A.".',
    kind: 'photo',
    source: 'EV-02',
    location: 'Torn edge of the family photograph',
    reliability: 'high',
    authenticity: 'genuine',
    relevance: 'optional',
    relatedCharacters: ['julian'],
    relatedEvents: ['TL-02'],
  },
  {
    id: 'OC-02',
    name: 'Scratched Clock Case',
    description:
      'Inside the back door of the mantel clock, someone has scratched into the brass: ' +
      '"11:13 \u2014 she is still calling."',
    kind: 'physical',
    source: 'EV-08',
    location: 'Inside the mantel clock',
    reliability: 'medium',
    authenticity: 'genuine',
    relevance: 'optional',
    relatedCharacters: ['clara'],
    relatedEvents: ['TL-06'],
  },
  {
    id: 'OC-03',
    name: 'Detective\u2019s Note',
    description:
      'Pencilled on the back of the third clipping, in the hand of the original officer: ' +
      '"Cousin not abroad? Ask the neighbour about the car. \u2014 D.I. Hart"',
    kind: 'document',
    source: 'EV-04',
    location: 'Back of a newspaper clipping',
    reliability: 'medium',
    authenticity: 'genuine',
    relevance: 'optional',
    relatedCharacters: ['julian', 'margaret'],
    relatedEvents: ['TL-02'],
  },
  {
    id: 'OC-04',
    name: 'Lily\u2019s Secret',
    description:
      'Written in crayon on the back of Lily\u2019s drawing: "Mummy says the cellar phone is our secret."',
    kind: 'document',
    source: 'EV-09',
    location: 'Back of Lily\u2019s drawing',
    reliability: 'medium',
    authenticity: 'genuine',
    relevance: 'optional',
    relatedCharacters: ['lily', 'clara'],
    relatedEvents: ['TL-06'],
  },
  // Found by torchlight in Lily's bedroom (optional, like the four above)
  {
    id: 'OC-05',
    name: 'Lily\u2019s Toy Telephone',
    description:
      'A red toy telephone. Taped under it, in Clara\u2019s hand: "If Mummy can\u2019t come, lift the ' +
      'real one downstairs and ring Mrs Hale. She is the nearest."',
    kind: 'physical',
    source: 'Lily\u2019s room',
    location: 'Lily\u2019s bedroom, on the toy shelf',
    reliability: 'medium',
    authenticity: 'genuine',
    relevance: 'optional',
    relatedCharacters: ['lily', 'clara', 'margaret'],
    relatedEvents: ['TL-06'],
  },
  {
    id: 'OC-06',
    name: 'Christmas Card',
    description:
      'Hidden at the back of the wardrobe, a Christmas card from 2007: "To my favourite girl. ' +
      'Be good, and keep our little secrets. Uncle J."',
    kind: 'document',
    source: 'Lily\u2019s room',
    location: 'Lily\u2019s bedroom, at the back of the wardrobe',
    reliability: 'medium',
    authenticity: 'genuine',
    relevance: 'optional',
    relatedCharacters: ['julian', 'lily'],
    relatedEvents: ['TL-02'],
  },
]

// Validate at import time
z.array(EvidenceSchema).parse(EVIDENCE_ITEMS)
