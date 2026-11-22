/**
 * Timed room searches (hidden-object scenes). Positions are % of each room picture.
 * Searches earn stars; they never yield evidence and never change the score.
 */
export type SearchMode = 'normal' | 'candle' | 'scrambled' | '1113'

export interface SearchItem {
  id: string
  name: string
  x: number
  y: number
  /** Hit radius in % of the picture width */
  r: number
  /** A cut-out the entity has moved here (11:13 mode only) */
  moved?: { src: string; w: number; rotate?: number }
}

export interface SearchScene {
  id: string
  name: string
  src: string
  ratio: number
  back: string
  items: SearchItem[]
  moved: SearchItem[]
}

export const SEARCH_MODES: Array<{ id: SearchMode; name: string; seconds: number; text: string }> = [
  { id: 'normal', name: 'Search', seconds: 90, text: 'Find everything on the list before time runs out.' },
  { id: 'candle', name: 'By Candlelight', seconds: 120, text: 'The lights are out. Search by candle.' },
  { id: 'scrambled', name: 'Scrambled', seconds: 90, text: 'The names on the list are jumbled.' },
  { id: '1113', name: '11:13', seconds: 90, text: 'Something has moved things around. Find what is out of place.' },
]

export const ITEMS_PER_SEARCH = 8

export const SEARCH_SCENES: SearchScene[] = [
  {
    id: 'study',
    name: 'The Study',
    src: '/assets/scene/study-scene.jpg',
    ratio: 1376 / 768,
    back: '/case/001/scene',
    items: [
      { id: 'globe-top', name: 'Globe', x: 20.9, y: 18.2, r: 3 },
      { id: 'globe-low', name: 'Large Globe', x: 21.1, y: 51, r: 3.2 },
      { id: 'telescope-l', name: 'Brass Telescope', x: 21.4, y: 34.1, r: 2.6 },
      { id: 'candle', name: 'Candle', x: 40, y: 55, r: 2.2 },
      { id: 'quill', name: 'Quill', x: 57.4, y: 58.6, r: 2.2 },
      { id: 'papers', name: 'Stack of Papers', x: 62.6, y: 62.2, r: 3 },
      { id: 'letter', name: 'Blank Letter', x: 50.1, y: 62.6, r: 2.6 },
      { id: 'wheel', name: 'Ship\u2019s Wheel', x: 76.9, y: 18.9, r: 2.6 },
      { id: 'telescope-r', name: 'Small Telescope', x: 76.7, y: 34, r: 2.4 },
      { id: 'armillary', name: 'Armillary Sphere', x: 77.2, y: 52, r: 2.6 },
      { id: 'lamp', name: 'Oil Lamp', x: 83.9, y: 25.4, r: 2.4 },
      { id: 'telephone', name: 'Telephone', x: 15.3, y: 62.5, r: 3 },
      { id: 'armchair', name: 'Armchair', x: 9, y: 72, r: 4.5 },
    ],
    moved: [
      { id: 'm-phone', name: 'Telephone on the Floor', x: 58, y: 90, r: 3.5, moved: { src: '/assets/evidence/telephone.png', w: 7, rotate: -8 } },
      { id: 'm-clock', name: 'Clock by the Chair', x: 26, y: 86, r: 3, moved: { src: '/assets/evidence/clock.png', w: 5 } },
      { id: 'm-diary', name: 'Diary on the Window Seat', x: 88, y: 63, r: 3, moved: { src: '/assets/evidence/diary.png', w: 6, rotate: 6 } },
      { id: 'm-recorder', name: 'Recorder on the Top Shelf', x: 60, y: 9, r: 2.8, moved: { src: '/assets/evidence/recorder.png', w: 4.5 } },
    ],
  },
  {
    id: 'lily-room',
    name: 'Lily\u2019s Room',
    src: '/assets/scene/lily-room.jpg',
    ratio: 1408 / 768,
    back: '/case/001/lily-room',
    items: [
      { id: 'musicbox', name: 'Music Box', x: 9.1, y: 54.7, r: 3 },
      { id: 'rabbit', name: 'Toy Rabbit', x: 28.8, y: 60, r: 3 },
      { id: 'doll', name: 'Doll in a Red Dress', x: 44, y: 34.5, r: 2.2 },
      { id: 'top', name: 'Spinning Top', x: 46.9, y: 35.4, r: 2 },
      { id: 'toyphone', name: 'Toy Telephone', x: 51.3, y: 35.8, r: 2.4 },
      { id: 'dolls', name: 'Row of Dolls', x: 49, y: 23.4, r: 4 },
      { id: 'draw-family', name: 'Drawing of a Family', x: 17.3, y: 30.7, r: 2.8 },
      { id: 'draw-sun', name: 'Drawing of the Sun', x: 23.1, y: 26.8, r: 2.6 },
      { id: 'draw-car', name: 'Drawing of a Car', x: 28.4, y: 32, r: 2.6 },
      { id: 'lit-window', name: 'Light Up the Lane', x: 71.2, y: 47.3, r: 2 },
      { id: 'keyhole', name: 'Wardrobe Keyhole', x: 91.8, y: 41.7, r: 2 },
      { id: 'bedknob', name: 'Brass Bed Knob', x: 44.2, y: 51.7, r: 2 },
      { id: 'quilt', name: 'Patchwork Quilt', x: 39.8, y: 73, r: 4 },
    ],
    moved: [
      { id: 'm-phone', name: 'Telephone on the Bed', x: 36, y: 66, r: 3.5, moved: { src: '/assets/evidence/telephone.png', w: 7, rotate: 10 } },
      { id: 'm-clock', name: 'Clock on the Windowsill', x: 64, y: 57, r: 3, moved: { src: '/assets/evidence/clock.png', w: 4.5 } },
      { id: 'm-diary', name: 'Diary by the Wardrobe', x: 84, y: 86, r: 3, moved: { src: '/assets/evidence/diary.png', w: 6, rotate: -5 } },
    ],
  },
]
