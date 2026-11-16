import type { GameState } from '@/types'

const CURRENT_VERSION = 1

/**
 * Called on store rehydration. If the stored version doesn't match the current
 * schema version, returns null (triggers a full reset). Otherwise returns the
 * state as-is.
 */
export function migrateState(stored: unknown): GameState | null {
  if (
    !stored ||
    typeof stored !== 'object' ||
    (stored as Record<string, unknown>).version !== CURRENT_VERSION
  ) {
    return null
  }
  return stored as GameState
}
