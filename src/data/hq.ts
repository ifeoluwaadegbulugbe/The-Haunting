/**
 * The investigation headquarters: one room, its clickable objects and the case archive.
 * Hotspot positions are in % of public/assets/scene/hq-room.jpg (1408×768).
 */
export type HqObjectId = 'desk' | 'telephone' | 'cabinet' | 'wall' | 'clock' | 'door'

export interface HqObject {
  id: HqObjectId
  name: string
  hint: string
  hotspot: { x: number; y: number; r: number }
}

export const HQ_ROOM = {
  src: '/assets/scene/hq-room.jpg',
  fallbackSrc: '/assets/scene/study-scene.jpg',
  ratio: 1408 / 768,
  glows: [
    { x: 43.3, y: 49, size: 9 }, // oil lamp
    { x: 64, y: 61, size: 8 }, // fireplace
  ],
}

export const HQ_OBJECTS: HqObject[] = [
  { id: 'desk', name: 'Investigation Desk', hint: 'Your current case file', hotspot: { x: 45, y: 67, r: 5 } },
  { id: 'telephone', name: 'Telephone', hint: 'Assignments come by telephone', hotspot: { x: 7.5, y: 54, r: 4.5 } },
  { id: 'cabinet', name: 'Case Cabinet', hint: 'The case archive', hotspot: { x: 24, y: 50, r: 5 } },
  { id: 'wall', name: 'Evidence Wall', hint: 'Open the evidence board', hotspot: { x: 40, y: 33, r: 5 } },
  { id: 'clock', name: 'Grandfather Clock', hint: 'It keeps a strange time', hotspot: { x: 77.7, y: 40, r: 4.5 } },
  { id: 'door', name: 'Locked Door', hint: 'Sealed', hotspot: { x: 86, y: 47, r: 4 } }, // left side of the door, so it stays in frame when the room is cropped
]

export interface ArchiveCase {
  number: string
  title: string
  location: string
  date: string
  classification: string
  difficulty: number // 1-5
  playable: boolean
  summary: string
}

export const CASE_ARCHIVE: ArchiveCase[] = [
  {
    number: 'CASE 001',
    title: 'The House That Calls Back',
    location: 'Ashworth House, Hollow Lane',
    date: '11 November 2008',
    classification: 'Disappearance · Recurring phenomenon',
    difficulty: 3,
    playable: true,
    summary: 'A family vanished in a single night. Every night since, at 11:13, the house telephones a neighbour.',
  },
  {
    number: 'CASE 002',
    title: 'The Drowned Choir',
    location: 'St Agnes, Marrow Fen',
    date: '3 February 1997',
    classification: 'Mass sighting',
    difficulty: 4,
    playable: false,
    summary: 'Sealed by order of the Archive.',
  },
  {
    number: 'CASE 003',
    title: 'Lantern Road',
    location: 'The A39, Exmoor',
    date: 'Unknown',
    classification: 'Unexplained deaths',
    difficulty: 5,
    playable: false,
    summary: 'Sealed by order of the Archive.',
  },
]

/** The clock creeps towards 11:13 as the entity notices you. */
export function clockTime(stage: number, solved: boolean): string {
  if (solved) return '11:13. The pendulum has stopped.'
  return ['10:40', '10:58', '11:06', '11:12', '11:13'][Math.min(4, Math.max(0, stage))]
}
