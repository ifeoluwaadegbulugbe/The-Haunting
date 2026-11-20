export const CURRENT_VERSION = 2

export const DEFAULT_AUDIO = {
  master: 0.8,
  music: 0.55,
  ambient: 0.7,
  sfx: 0.8,
  muted: false,
}

/**
 * Called on store rehydration.
 * - v2: returned as-is.
 * - v1: upgraded in place, keeping all progress (new fields get defaults).
 * - anything else: null, which triggers a clean restart.
 */
export function migrateState<T extends Record<string, unknown>>(stored: T | null | undefined): T | null {
  if (!stored || typeof stored !== 'object') return null
  const version = stored.version
  if (version === CURRENT_VERSION) return stored
  if (version === 1) {
    return {
      ...stored,
      version: CURRENT_VERSION,
      audio: (stored.audio as object | undefined) ?? { ...DEFAULT_AUDIO },
      seenCinematics: (stored.seenCinematics as string[] | undefined) ?? [],
      achievements: (stored.achievements as string[] | undefined) ?? [],
    }
  }
  return null
}
