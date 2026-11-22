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

/** Escalating hints for Clara's laptop, from a nudge to the answer. */
export const LAPTOP_HINTS = [
  'Clara pencilled a note about it inside the back cover of her diary.',
  'The note reads: "her name, then the day of her concert". "Her" is not Clara. Read the November entries in the diary.',
  "Her daughter's name, then the day of Lily's concert, written as a number. The diary entry for 1 November gives the date.",
  `Clara's password was "${LAPTOP_ANSWER}".`,
] as const

/** Hint level reached by wrong attempts alone (0 = none yet). */
export function laptopHintLevel(wrongAttempts: number): number {
  if (wrongAttempts >= 6) return 4
  if (wrongAttempts >= 4) return 3
  if (wrongAttempts >= 2) return 1
  return 0
}

/**
 * The hint for a level (1..4), or null for 0. Without the diary, the first hint
 * sends the player to find it.
 */
export function laptopHintAt(level: number, hasDiary = true): string | null {
  if (level <= 0) return null
  if (level === 1 && !hasDiary) return "Clara kept a diary in the study. People write down what they are afraid of forgetting."
  return LAPTOP_HINTS[Math.min(level, LAPTOP_HINTS.length) - 1]
}

/** Hint shown after a number of wrong attempts (null = no hint yet). */
export function laptopHint(wrongAttempts: number): string | null {
  return laptopHintAt(laptopHintLevel(wrongAttempts))
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
