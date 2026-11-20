/**
 * Device puzzles in the Digital Archives. They gate how a record is opened, never
 * which evidence exists or when a section unlocks. Every puzzle has escalating hints
 * so a player can never be stuck.
 */

/** Clara's diary: "her name, then the day of her concert" (Lily, concert on the 14th). */
export function checkLaptopPassword(input: string): boolean {
  const n = input.toLowerCase().replace(/[^a-z0-9]/g, '')
  return n === 'lily14' || n === 'lily14th'
}

export const LAPTOP_ANSWER = 'lily14'

/** Hint shown after a number of wrong attempts (null = no hint yet). */
export function laptopHint(wrongAttempts: number): string | null {
  if (wrongAttempts >= 6) return `Clara's password was "${LAPTOP_ANSWER}".`
  if (wrongAttempts >= 4) return "Her daughter's name, then the day of Lily's concert, written as a number."
  if (wrongAttempts >= 2) return 'Clara pencilled a note about it inside the back cover of her diary.'
  return null
}

/** Photo enhancement targets, in % of the photograph (photo-car-drive.jpg). */
export const PHOTO_TARGETS = {
  car: { x: 41, y: 75, w: 24, h: 18 },
  plate: { x: 49.7, y: 78.6, r: 6 },
} as const

export function inCar(x: number, y: number): boolean {
  const c = PHOTO_TARGETS.car
  return Math.abs(x - c.x) <= c.w / 2 && Math.abs(y - c.y) <= c.h / 2
}

export function onPlate(x: number, y: number): boolean {
  const p = PHOTO_TARGETS.plate
  return Math.hypot(x - p.x, y - p.y) <= p.r
}

/**
 * Where a click on a zoomed image lands on the original picture.
 * The image is scaled by `scale` around `origin` (all values in %).
 */
export function unzoom(p: { x: number; y: number }, origin: { x: number; y: number }, scale: number) {
  return { x: origin.x + (p.x - origin.x) / scale, y: origin.y + (p.y - origin.y) / scale }
}
