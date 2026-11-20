'use client'

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Award } from 'lucide-react'
import { useFxStore, type FlyingCard } from '@/store/fxStore'
import { useGameStore } from '@/store/gameStore'
import { useHydrated } from '@/store/useHydrated'
import { ACHIEVEMENTS } from '@/data/achievements'
import { CASE_001 } from '@/data/case001'
import { audio } from '@/lib/audio/engine'
import { prefersReducedMotion } from '@/lib/motion'

/** An evidence card that flies from where it was found into the inventory tray. */
function Flying({ card }: { card: FlyingCard }) {
  const landed = useFxStore((s) => s.landed)
  const ev = CASE_001.evidence.find((e) => e.id === card.evidenceId)
  const target = typeof window !== 'undefined'
    ? { x: window.innerWidth / 2, y: window.innerHeight - 30 }
    : { x: 0, y: 0 }
  const reduced = prefersReducedMotion()
  return (
    <motion.div
      className="fixed left-0 top-0 w-32 rounded-sm px-3 py-2 text-center"
      style={{ background: 'var(--parchment-light)', boxShadow: '0 0 24px rgba(232,177,93,0.7)', border: '1px solid var(--gold)' }}
      initial={{ x: card.from.x - 64, y: card.from.y - 20, scale: 1.25, opacity: 0, rotate: -6 }}
      animate={{
        x: [card.from.x - 64, card.from.x - 64, target.x - 64],
        y: [card.from.y - 20, card.from.y - 60, target.y - 20],
        scale: [1.25, 1.3, 0.45],
        opacity: [0, 1, 0.9],
        rotate: [-6, 2, 0],
      }}
      transition={{ duration: reduced ? 0.01 : 1.1, times: [0, 0.35, 1], ease: 'easeInOut' }}
      onAnimationComplete={() => { audio.sfx('pin', 0.7); landed(card.id) }}
    >
      <p className="font-cinzel text-[9px] tracking-[0.2em] text-brown">EVIDENCE</p>
      <p className="font-cormorant font-bold text-obsidian text-sm leading-tight">{ev?.name ?? card.evidenceId}</p>
    </motion.div>
  )
}

/** Watches the game state and unlocks achievements as they are earned. */
function AchievementWatcher() {
  const hydrated = useHydrated()
  const state = useGameStore((s) => s)
  const unlock = useGameStore((s) => s.unlockAchievement)
  const primed = useRef(false)

  useEffect(() => {
    if (!hydrated) return
    const earned = ACHIEVEMENTS.filter((a) => a.earned(state) && !(state.achievements ?? []).includes(a.id))
    if (earned.length === 0) { primed.current = true; return }
    if (!primed.current) {
      // Achievements already earned in an older save are recorded silently
      useGameStore.setState({ achievements: [...(state.achievements ?? []), ...earned.map((a) => a.id)] })
      primed.current = true
      return
    }
    earned.forEach((a) => unlock(a.id))
  }, [hydrated, state, unlock])

  return null
}

/** Rendered once in the root layout: flying evidence and achievement toasts. */
export function FxLayer() {
  const flying = useFxStore((s) => s.flying)
  const toasts = useFxStore((s) => s.toasts)
  const dismiss = useFxStore((s) => s.dismissToast)

  useEffect(() => {
    if (toasts.length === 0) return
    audio.sfx('confirm', 0.8)
    const t = setTimeout(() => dismiss(toasts[0].id), 4500)
    return () => clearTimeout(t)
  }, [toasts, dismiss])

  return (
    <>
      <AchievementWatcher />
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 46 }}>
        {flying.map((c) => <Flying key={c.id} card={c} />)}
      </div>
      <div className="fixed top-16 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col gap-2" style={{ zIndex: 47 }}>
        <AnimatePresence>
          {toasts.slice(0, 1).map((t) => {
            const a = ACHIEVEMENTS.find((x) => x.id === t.achievementId)
            if (!a) return null
            return (
              <motion.div
                key={t.id}
                role="status"
                initial={{ opacity: 0, y: -24, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="flex items-center gap-3 px-5 py-3 rounded border border-gold"
                style={{ background: 'rgba(14,12,16,0.94)', boxShadow: '0 0 30px rgba(165,138,96,0.35)' }}
              >
                <Award size={22} color="var(--candle)" />
                <div>
                  <p className="font-cinzel text-[10px] tracking-[0.25em] text-parchment-dark">ACHIEVEMENT</p>
                  <p className="font-cormorant font-bold text-parchment text-lg leading-tight">{a.title}</p>
                  <p className="font-inter text-xs text-parchment-dark">{a.description}</p>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </>
  )
}
