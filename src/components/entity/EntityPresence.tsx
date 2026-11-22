'use client'
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useHydrated } from '@/store/useHydrated'
import { useGameStore } from '@/store/gameStore'
import { audio } from '@/lib/audio/engine'

const AWAY_TITLE = 'She is still calling\u2026'
/** How long the player must be away before the photograph has changed */
const AWAY_MS = 5000

export function isElevenThirteen(d: Date): boolean {
  return d.getMinutes() === 13 && (d.getHours() === 11 || d.getHours() === 23)
}

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * The entity reaches outside the game: it renames the tab while you are away, the family
 * photograph has changed when you come back, and at 11:13 on your own clock it calls.
 */
export function EntityPresence() {
  const hydrated = useHydrated()
  const stage = useGameStore((s) => s.entity.stage)
  const verdict = useGameStore((s) => s.verdict)
  const started = useGameStore((s) => Boolean(s.investigator.name))
  const markClockEvent = useGameStore((s) => s.markClockEvent)
  const unlockAchievement = useGameStore((s) => s.unlockAchievement)
  const [photo, setPhoto] = useState(false)
  const [clock, setClock] = useState(false)
  const awayAt = useRef<number | null>(null)
  const title = useRef<string>('')
  const active = hydrated && started && stage >= 1 && !verdict

  // Away: the tab is renamed. Back: the photograph has changed, for a moment
  useEffect(() => {
    if (!active) return
    const onVis = () => {
      if (document.hidden) {
        awayAt.current = Date.now()
        title.current = document.title
        document.title = AWAY_TITLE
      } else {
        if (title.current) document.title = title.current
        if (awayAt.current && Date.now() - awayAt.current >= AWAY_MS) {
          setPhoto(true)
          audio.sfx('static', 0.6)
          setTimeout(() => setPhoto(false), 1600)
        }
        awayAt.current = null
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [active])

  // 11:13 on the player's own clock, once a day
  useEffect(() => {
    if (!hydrated || !started || verdict) return
    const check = () => {
      const now = new Date()
      const day = dayKey(now)
      if (!isElevenThirteen(now) || (useGameStore.getState().clockEvents ?? []).includes(day)) return
      markClockEvent(day)
      unlockAchievement('on-time')
      audio.sfx('phone-ring', 0.9)
      setTimeout(() => audio.sfx('phone-ring', 0.9), 3000)
      setClock(true)
    }
    check()
    const t = setInterval(check, 15000)
    return () => clearInterval(t)
  }, [hydrated, started, verdict, markClockEvent, unlockAchievement])

  return (
    <>
      <AnimatePresence>
        {photo && (
          <motion.div aria-hidden="true" className="fixed inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 57, background: 'rgba(8,7,9,0.7)' }} initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.6, 1] }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <div className="relative w-[min(520px,80vw)] haunt-glitch">
              <img src="/assets/evidence/photo-family-torn.jpg" alt="" className="w-full rounded-sm" style={{ filter: 'grayscale(0.6) contrast(1.2)' }} />
              {/* someone new stands at the torn edge */}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                <path d="M82 100 L82 52 Q84 30 90 28 Q97 30 98 52 L98 100 Z" fill="var(--ink)" opacity="0.85" />
                <circle cx="90" cy="22" r="7" fill="var(--ink)" opacity="0.9" />
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {clock && (
          <motion.div
            role="alertdialog"
            aria-label="It is 11:13"
            className="fixed inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center"
            style={{ zIndex: 59, background: 'rgba(8,7,9,0.94)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="font-cinzel text-5xl tracking-[0.3em]" style={{ color: 'var(--entity-glow)', textShadow: '0 0 24px var(--entity)' }}>11:13</p>
            <p className="font-cormorant italic text-parchment text-2xl max-w-lg">Look at your clock. It is 11:13 where you are, too. She is calling you now.</p>
            <button onClick={() => { audio.sfx('pickup'); setClock(false) }} className="font-inter text-base text-parchment underline">Answer</button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
