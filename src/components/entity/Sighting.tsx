'use client'

import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { AnimatePresence, motion } from 'framer-motion'
import { useHydrated } from '@/store/useHydrated'
import { useGameStore } from '@/store/gameStore'
import { nextFragment } from '@/store/story'
import { audio } from '@/lib/audio/engine'
import { SIGHTING_SPOTS, SIGHTING_DELAY, SIGHTING_SECONDS, type Fragment } from '@/data/case001/story'

/** The fragment just found, shown by <FragmentCard /> in the layout (outside any transformed room). */
export const useFragmentView = create<{ shown: Fragment | null; show: (f: Fragment | null) => void }>((set) => ({
  shown: null,
  show: (f) => set({ shown: f }),
}))

/**
 * The entity, caught for a moment in a reflection. Placed inside a room picture at
 * the room's spot. Catching it gives one of Clara's fragments. Presentation only.
 */
export function Sighting({ spot }: { spot: keyof typeof SIGHTING_SPOTS }) {
  const hydrated = useHydrated()
  const stage = useGameStore((s) => s.entity.stage)
  const verdict = useGameStore((s) => s.verdict)
  const fragments = useGameStore((s) => s.fragments)
  const collectFragment = useGameStore((s) => s.collectFragment)
  const [visible, setVisible] = useState(false)
  const [round, setRound] = useState(0)
  const where = SIGHTING_SPOTS[spot]
  const next = nextFragment({ fragments })
  const eligible = hydrated && stage >= 1 && !verdict && Boolean(next)

  useEffect(() => {
    if (!eligible) return
    const wait = (SIGHTING_DELAY.min + Math.random() * (SIGHTING_DELAY.max - SIGHTING_DELAY.min)) * 1000
    const t = setTimeout(() => { setVisible(true); audio.sfx('whisper', 0.35) }, wait)
    return () => clearTimeout(t)
  }, [eligible, round])

  useEffect(() => {
    if (!visible) return
    const t = setTimeout(() => { setVisible(false); setRound((r) => r + 1) }, SIGHTING_SECONDS * 1000)
    return () => clearTimeout(t)
  }, [visible])

  const catchIt = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!next) return
    collectFragment(next.id)
    audio.sfx('sting', 0.8)
    setTimeout(() => audio.sfx('whisper', 0.7), 300)
    setVisible(false)
    setRound((r) => r + 1)
    useFragmentView.getState().show(next)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key={round}
          onClick={catchIt}
          aria-label={`Something ${where.where}`}
          className="absolute pointer-events-auto rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          style={{ left: `${where.x}%`, top: `${where.y}%`, width: `${where.size}%`, aspectRatio: '3 / 4', x: '-50%', y: '-50%', background: 'none', zIndex: 3 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.55, 0.3, 0.6, 0.45] }}
          exit={{ opacity: 0, filter: 'blur(6px)', transition: { duration: 0.6 } }}
          transition={{ duration: 2.4 }}
        >
          <Face />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

function Face() {
  return (
    <svg viewBox="0 0 60 80" className="w-full h-full haunt-glitch" aria-hidden="true" style={{ filter: 'blur(1.2px)' }}>
      <defs>
        <radialGradient id="sighting-face" cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor="var(--parchment-light)" stopOpacity="0.9" />
          <stop offset="70%" stopColor="var(--parchment-dark)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--ink)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="30" cy="36" rx="22" ry="30" fill="url(#sighting-face)" />
      <path d="M8 20 Q30 -6 52 20 L54 70 Q30 60 6 70 Z" fill="var(--ink)" opacity="0.55" />
      <ellipse cx="21" cy="34" rx="4.5" ry="6" fill="var(--ink)" />
      <ellipse cx="39" cy="34" rx="4.5" ry="6" fill="var(--ink)" />
      <ellipse cx="30" cy="54" rx="5" ry="2.4" fill="var(--entity)" opacity="0.6" />
    </svg>
  )
}

/** Shows a fragment of Clara's last hour once it is found. */
export function FragmentCard() {
  const shown = useFragmentView((s) => s.shown)
  const show = useFragmentView((s) => s.show)
  const total = useGameStore((s) => (s.fragments ?? []).length)
  return (
    <AnimatePresence>
      {shown && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center px-6"
          style={{ zIndex: 58, background: 'rgba(8,7,9,0.82)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => show(null)}
        >
          <motion.div role="dialog" aria-modal="true" aria-label="A memory" initial={{ scale: 0.94, filter: 'blur(8px)' }} animate={{ scale: 1, filter: 'blur(0px)' }} transition={{ duration: 1.1 }} className="max-w-xl text-center space-y-4">
            <p className="font-cinzel text-xs tracking-[0.35em]" style={{ color: 'var(--entity-glow)' }}>CLARA · {shown.time}</p>
            <p className="font-caveat text-3xl leading-snug" style={{ color: 'var(--parchment-light)', textShadow: '0 0 18px var(--entity)' }}>{shown.text}</p>
            <p className="font-inter text-sm text-parchment-dark">Memory {total} of 6 · kept in your notebook</p>
            <button onClick={() => show(null)} className="font-inter text-sm text-parchment underline">Let it go</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
