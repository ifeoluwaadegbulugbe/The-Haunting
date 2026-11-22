import type { Condition } from '@/types'

/**
 * Lily's bedroom, explored by torchlight. Optional: it holds two hidden details
 * (OC-05, OC-06) and atmosphere. Nothing here is needed to solve the case.
 * Positions are % of public/assets/scene/lily-room.jpg (1408×768).
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
    hotspot: { x: 29, y: 60 },
    text: 'Made, with the covers turned down and a rabbit on the pillow. Someone expected her home that night.',
  },
  {
    id: 'LR-window',
    name: 'Window',
    hotspot: { x: 68, y: 31 },
    text: 'Up the lane, a single lit window: Mrs Hale\u2019s house. From there she could see every car in the drive.',
  },
  {
    id: 'LR-toys',
    name: 'Toy Shelf',
    hotspot: { x: 51.3, y: 35.5 },
    text: 'Dolls, a spinning top, and a red toy telephone with a curly cord. Something is taped underneath it.',
    yields: 'OC-05',
    interaction: 'lift',
  },
  {
    id: 'LR-wardrobe',
    name: 'Wardrobe',
    hotspot: { x: 87, y: 44 },
    text: 'Small dresses on small hangers. At the back, behind a shoebox, an envelope.',
    yields: 'OC-06',
    interaction: 'doors',
  },
  {
    id: 'LR-musicbox',
    name: 'Music Box',
    hotspot: { x: 8.9, y: 54 },
    text: 'You wind it. It plays three bars of a lullaby and stops on the same note every time.',
  },
  {
    id: 'LR-drawings',
    name: 'Drawings on the Wall',
    hotspot: { x: 22.5, y: 29 },
    text: 'Crayon drawings: a family holding hands, a yellow sun, and a red car parked outside a house.',
  },
]
