import { z } from 'zod'
import { SceneObjectSchema } from '@/types'
import type { SceneObject } from '@/types'

// Hotspot coordinates are percentage-based so they scale with the image.
// These are initial estimates — refine once the final scene image is in place.

export const SCENE_OBJECTS: SceneObject[] = [
  {
    id: 'OBJ-telephone',
    name: 'Rotary Telephone',
    description:
      'An old rotary telephone mounted beside the fireplace. ' +
      'A faded label reads "Ext 2 — Cellar."',
    hotspot: { x: 18, y: 55, r: 5 },
    locationId: 'study',
    yieldsEvidence: ['EV-01'],
    relatedCharacters: ['clara'],
    storyRelevance:
      'The cellar extension that Clara used to call Margaret. The first entity trigger.',
  },
  {
    id: 'OBJ-photograph',
    name: 'Torn Family Photograph',
    description:
      'A framed Christmas photograph on the mantelpiece. ' +
      'The right edge has been torn away — a figure is missing.',
    hotspot: { x: 50, y: 30, r: 5 },
    locationId: 'study',
    yieldsEvidence: ['EV-02'],
    relatedCharacters: ['edmund', 'clara', 'lily', 'julian'],
    storyRelevance: 'Shows Julian was part of the family before he erased himself.',
  },
  {
    id: 'OBJ-diary',
    name: "Clara's Diary",
    description:
      "A leather-bound diary on the writing desk. Clara's handwriting fills the pages — " +
      'except the last few, which have been torn out. A small key is taped inside the back cover.',
    hotspot: { x: 70, y: 60, r: 5 },
    locationId: 'study',
    yieldsEvidence: ['EV-03'],
    relatedCharacters: ['clara', 'julian'],
    storyRelevance:
      "Records Julian's repeated visits and requests for money. The key opens the cabinet.",
  },
  {
    id: 'OBJ-clippings',
    name: 'Newspaper Clippings',
    description:
      'Three yellowed newspaper clippings pinned to the wall. ' +
      "They report the official account of the family's disappearance.",
    hotspot: { x: 85, y: 35, r: 4.5 },
    locationId: 'study',
    yieldsEvidence: ['EV-04'],
    relatedCharacters: ['julian', 'dorothea'],
    storyRelevance: 'The official story — full of lies.',
  },
  {
    id: 'OBJ-clock',
    name: 'Mantel Clock',
    description:
      'A brass mantel clock. Its hands are frozen at 11:13. ' +
      'Something appears to be hidden behind it.',
    hotspot: { x: 50, y: 48, r: 4.5 },
    locationId: 'study',
    yieldsEvidence: ['EV-08'],
    discoveryCondition: {
      allOf: [{ type: 'hasEvidence', ref: 'EV-01' }],
    },
    relatedCharacters: ['dorothea'],
    storyRelevance: "Dorothea's logbook hidden here proves she left before dark.",
  },
  {
    id: 'OBJ-recorder',
    name: 'Study Recorder',
    description:
      'A small cassette recorder on the desk. The tape is still inside.',
    hotspot: { x: 65, y: 50, r: 4.5 },
    locationId: 'study',
    yieldsEvidence: ['EV-07'],
    discoveryCondition: {
      allOf: [{ type: 'hasEvidence', ref: 'EV-01' }],
    },
    relatedCharacters: ['julian', 'edmund'],
    storyRelevance:
      "Records the argument and Edmund's death. The most damning single piece of evidence.",
  },
  {
    id: 'OBJ-cabinet',
    name: 'Locked Cabinet',
    description:
      'A wooden cabinet with a small keyhole. It is locked. ' +
      "The key from Clara's diary fits.",
    hotspot: { x: 32, y: 65, r: 5 },
    locationId: 'study',
    yieldsEvidence: ['EV-05', 'EV-06'],
    discoveryCondition: {
      allOf: [{ type: 'hasEvidence', ref: 'EV-03' }],
    },
    relatedCharacters: ['julian', 'edmund', 'lily'],
    storyRelevance:
      'Contains the torn photograph strip and the unsigned will — both prove motive.',
  },
  {
    id: 'OBJ-belongings',
    name: "Lily's Belongings",
    description:
      "A small pile of a child's things: a coat, some books, a crayon drawing.",
    hotspot: { x: 20, y: 75, r: 4.5 },
    locationId: 'study',
    yieldsEvidence: ['EV-09'],
    discoveryCondition: {
      allOf: [{ type: 'hasEvidence', ref: 'EV-02' }],
    },
    relatedCharacters: ['lily'],
    storyRelevance:
      "Lily's drawing shows two figures underground — she knew something was wrong.",
  },
  {
    id: 'OBJ-rug',
    name: 'Study Rug',
    description:
      'A heavy Persian rug. One corner is raised slightly, as if something is beneath it.',
    hotspot: { x: 50, y: 80, r: 5 },
    locationId: 'study',
    yieldsEvidence: ['EV-10'],
    discoveryCondition: {
      allOf: [{ type: 'hasEvidence', ref: 'EV-09' }],
    },
    relatedCharacters: ['julian'],
    storyRelevance:
      "Julian's final debt notice — the financial pressure that drove him to murder.",
  },
]

// Validate at import time
z.array(SceneObjectSchema).parse(SCENE_OBJECTS)
