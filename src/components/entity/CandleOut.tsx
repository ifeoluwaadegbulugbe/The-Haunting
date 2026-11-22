'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'
import { audio } from '@/lib/audio/engine'

const EVERY_MS = 55_000
const MAX_DARK = 0.6

/**
 * While the entity is hostile, the candles go out now and then and the room darkens.
 * Relighting takes one click. It never covers more than 60% and never blocks a click.
 */
export function CandleOut() {
  const stage = useGameStore((s) => s.entity.stage)
  const verdict = useGameStore((s) => s.verdict)
  const [out, setOut] = useState(false)
  const hostile = stage >= 3 && !verdict

  useEffect(() => {
    if (!hostile || out) return
    const t = setTimeout(() => { setOut(true); audio.sfx('whoosh', 0.6); audio.sfx('drone', 0.4) }, EVERY_MS)
    return () => clearTimeout(t)
  }, [hostile, out])

  return (
    <AnimatePresence>
      {out && (
        <>
          <motion.div
            key="dark"
            aria-hidden="true"
            className="fixed inset-0 pointer-events-none"
            style={{ zIndex: 9, background: 'var(--ink)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: MAX_DARK }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
            transition={{ duration: 8 }}
          />
          <motion.button
            key="relight"
            onClick={() => { audio.sfx('click'); audio.sfx('chime', 0.4); setOut(false) }}
            className="fixed left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded border font-inter text-sm text-parchment"
            style={{ top: 110, zIndex: 14, background: 'rgba(14,12,16,0.9)', borderColor: 'var(--entity)' }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Flame size={16} color="var(--candle)" /> The candles have gone out. Relight them
          </motion.button>
        </>
      )}
    </AnimatePresence>
  )
}
