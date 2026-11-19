'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'

const SHOW_MS = 9000

/**
 * Entity messages, shown on every page for a few seconds after they arrive.
 * Rendered once in the root layout. Never blocks clicks.
 */
export function NotificationTray() {
  const messages = useGameStore((s) => s.entity.messages)
  const solved = useGameStore((s) => Boolean(s.verdict))
  const [now, setNow] = useState(() => Date.now())

  // Re-render while a message is on screen so it disappears on time
  const newest = messages.length ? messages[messages.length - 1].at : 0
  useEffect(() => {
    setNow(Date.now())
    if (!newest || Date.now() - newest > SHOW_MS) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    const stop = setTimeout(() => clearInterval(t), SHOW_MS + 1000)
    return () => { clearInterval(t); clearTimeout(stop) }
  }, [newest])

  if (solved) return null
  const visible = messages.filter((m) => now - m.at < SHOW_MS).slice(-3)

  return (
    <div
      className="fixed left-4 z-30 flex flex-col gap-2 max-w-xs pointer-events-none"
      style={{ bottom: '84px' }}
      aria-live="polite"
      aria-label="Entity messages"
    >
      <AnimatePresence>
        {visible.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="font-caveat text-base px-4 py-3 rounded-sm border"
            style={{
              background: 'rgba(14,12,16,0.9)',
              borderColor: 'var(--entity)',
              color: 'var(--entity-glow)',
              textShadow: '0 0 8px var(--entity)',
            }}
          >
            {msg.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
