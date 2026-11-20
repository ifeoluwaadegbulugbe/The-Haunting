import type { Condition } from '@/types'

/**
 * Lily's bedroom, explored by torchlight. Optional: it holds two hidden details
 * (OC-05, OC-06) and atmosphere. Nothing here is needed to solve the case.
 * Positions are % of the room picture (16:9).
 */
export interface LilyRoomObject {
  id: string
  name: string
  hotspot: { x: number; y: number }
  text: string
  /** Hidden detail found here */
  yields?: string
  /** How the detail is reached */
  interaction?: 'doors' | 'lift'
}

export const LILY_ROOM_UNLOCK: Condition = { allOf: [{ type: 'hasEvidence', ref: 'EV-09' }] }

export const LILY_ROOM_OBJECTS: LilyRoomObject[] = [
  {
    id: 'LR-bed',
    name: 'Lily\u2019s Bed',
    hotspot: { x: 26, y: 70 },
    text: 'Made, with the covers turned down and a rabbit on the pillow. Someone expected her home that night.',
  },
  {
    id: 'LR-window',
    name: 'Window',
    hotspot: { x: 62, y: 32 },
    text: 'Up the lane, a single lit window: Mrs Hale\u2019s house. From there she could see every car in the drive.',
  },
  {
    id: 'LR-toys',
    name: 'Toy Shelf',
    hotspot: { x: 44, y: 46 },
    text: 'Dolls, a spinning top, and a red toy telephone with a curly cord. Something is taped underneath it.',
    yields: 'OC-05',
    interaction: 'lift',
  },
  {
    id: 'LR-wardrobe',
    name: 'Wardrobe',
    hotspot: { x: 85, y: 52 },
    text: 'Small dresses on small hangers. At the back, behind a shoebox, an envelope.',
    yields: 'OC-06',
    interaction: 'doors',
  },
  {
    id: 'LR-musicbox',
    name: 'Music Box',
    hotspot: { x: 11, y: 56 },
    text: 'You wind it. It plays three bars of a lullaby and stops on the same note every time.',
  },
  {
    id: 'LR-drawings',
    name: 'Drawings on the Wall',
    hotspot: { x: 30, y: 24 },
    text: 'Crayon drawings: a house, a sun, and a telephone whose long cord goes down, and down, into the ground.',
  },
]
