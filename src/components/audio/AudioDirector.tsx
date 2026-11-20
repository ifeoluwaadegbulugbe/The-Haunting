'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { DEFAULT_AUDIO } from '@/store/migrations'
import { audio } from '@/lib/audio/engine'
import { soundscapeFor } from '@/lib/audio/soundscapes'

/**
 * Global audio wiring, rendered once in the root layout:
 * - unlocks audio on the first click or key press (browser autoplay rule)
 * - keeps volumes in line with the player's settings
 * - switches music and ambience when the player changes room
 * - raises the entity's drone as its stage climbs
 * - gives every button and link a click sound
 */
export function AudioDirector() {
  const pathname = usePathname()
  const settings = useGameStore((s) => s.audio ?? DEFAULT_AUDIO)
  const stage = useGameStore((s) => s.entity.stage)
  const solved = useGameStore((s) => Boolean(s.verdict))

  useEffect(() => { audio.setSettings(settings) }, [settings])

  useEffect(() => {
    const { music, ambient } = soundscapeFor(pathname ?? '/')
    audio.setMusic(music)
    audio.setAmbient(ambient)
  }, [pathname])

  useEffect(() => {
    // The entity falls silent once the truth is out
    audio.setDrone(solved ? 0 : Math.max(0, stage - 1))
  }, [stage, solved])

  useEffect(() => {
    const onGesture = () => audio.unlock()
    const onPointer = (e: PointerEvent) => {
      audio.unlock()
      const el = (e.target as HTMLElement | null)?.closest('button, a, [role="button"], select, summary')
      if (!el) return
      if ((el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') {
        audio.sfx('deny', 0.6)
        return
      }
      if (el.hasAttribute('data-silent')) return
      audio.sfx('click', 0.9)
    }
    window.addEventListener('pointerdown', onPointer, { capture: true })
    window.addEventListener('keydown', onGesture, { capture: true })
    return () => {
      window.removeEventListener('pointerdown', onPointer, { capture: true })
      window.removeEventListener('keydown', onGesture, { capture: true })
    }
  }, [])

  return null
}
