'use client'

import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'

/**
 * Syncs the --haunt-level CSS variable on <html> with the entity stage.
 * Rendered once in the root layout.
 */
export function HauntLevelSync() {
  const stage = useGameStore((s) => s.entity.stage)

  useEffect(() => {
    document.documentElement.style.setProperty('--haunt-level', String(stage))
  }, [stage])

  return null
}
