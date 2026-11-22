import type { SearchItem, SearchMode, SearchScene } from '@/data/case001/search'
import { ITEMS_PER_SEARCH, SEARCH_MODES } from '@/data/case001/search'

/** Items found within this many ms of the last one build a combo. */
export const COMBO_WINDOW_MS = 4000
export const MISS_PENALTY = 50
export const STAR_THRESHOLDS = [900, 1400, 1900, 2400] as const

/** Points for one find: 100 times the combo (1, 2, 3, capped at 4). */
export function findPoints(combo: number): number {
  return 100 * Math.min(4, Math.max(1, combo))
}

/** The combo after a find made `sinceLastMs` after the previous one. */
export function nextCombo(combo: number, sinceLastMs: number | null): number {
  return sinceLastMs !== null && sinceLastMs <= COMBO_WINDOW_MS ? combo + 1 : 1
}

/** Final score: finds, time left (10 a second), minus misses. Never below zero. */
export function finalScore(findPointsTotal: number, secondsLeft: number, misses: number): number {
  return Math.max(0, findPointsTotal + secondsLeft * 10 - misses * MISS_PENALTY)
}

/** 0 stars if time ran out, otherwise 1 to 5. */
export function searchStars(score: number, completed: boolean): number {
  if (!completed) return 0
  return 1 + STAR_THRESHOLDS.filter((t) => score >= t).length
}

/** A mode opens once the previous mode has earned a star in this scene. */
export function modeUnlocked(sceneId: string, mode: SearchMode, results: Record<string, { stars: number }>): boolean {
  const i = SEARCH_MODES.findIndex((m) => m.id === mode)
  if (i <= 0) return true
  return (results[`${sceneId}:${SEARCH_MODES[i - 1].id}`]?.stars ?? 0) >= 1
}

/** Small deterministic shuffle so replays get a different list. */
function seeded(seed: number) {
  let s = seed % 2147483647 || 1
  return () => (s = (s * 48271) % 2147483647) / 2147483647
}

/** The list for one search: moved objects first in 11:13 mode, filled from the room. */
export function pickItems(scene: SearchScene, mode: SearchMode, seed: number): SearchItem[] {
  const rnd = seeded(seed + 1)
  const pool = [...scene.items].sort(() => rnd() - 0.5)
  const first = mode === '1113' ? scene.moved : []
  return [...first, ...pool].slice(0, ITEMS_PER_SEARCH)
}

/** Jumble a name, keeping word lengths, never returning it unchanged. */
export function scramble(name: string, seed = 7): string {
  const rnd = seeded(seed + name.length)
  return name
    .split(' ')
    .map((w) => {
      if (w.length < 3) return w
      const letters = w.toUpperCase().split('')
      for (let k = 0; k < 6; k++) {
        const shuffled = [...letters].sort(() => rnd() - 0.5).join('')
        if (shuffled !== w.toUpperCase()) return shuffled
      }
      return letters.reverse().join('')
    })
    .join(' ')
}

/** Is a click (in % of the picture) on this item? Height is scaled by the picture's ratio. */
export function hits(item: SearchItem, x: number, y: number, ratio: number): boolean {
  return Math.hypot(x - item.x, (y - item.y) / ratio) <= item.r
}
