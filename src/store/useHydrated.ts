'use client'

import { useEffect, useState } from 'react'
import { useGameStore } from './gameStore'

/**
 * Returns false until the Zustand persist middleware has finished reading from
 * localStorage. Use this to avoid server/client hydration mismatches.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // If the store is already hydrated (e.g. subsequent renders), resolve immediately.
    const unsubscribe = useGameStore.persist.onFinishHydration(() => {
      setHydrated(true)
    })

    // Persist may have already finished by the time this effect runs.
    if (useGameStore.persist.hasHydrated()) {
      setHydrated(true)
    }

    return unsubscribe
  }, [])

  return hydrated
}
