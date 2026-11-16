'use client'

import { AnimatePresence, motion } from 'framer-motion'
import type { EntityMessageRecord } from '@/types'

interface NotificationTrayProps {
  messages: EntityMessageRecord[]
}

export function NotificationTray({ messages }: NotificationTrayProps) {
  if (messages.length === 0) return null

  return (
    <div
      className="fixed bottom-6 left-6 z-30 flex flex-col gap-2 max-w-xs"
      aria-live="polite"
      aria-label="Entity messages"
    >
      <AnimatePresence>
        {messages.slice(-3).map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="font-caveat text-sm px-4 py-3 rounded-sm border"
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
