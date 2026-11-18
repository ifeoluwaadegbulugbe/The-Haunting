'use client'

import { motion } from 'framer-motion'

export function TypingDots() {
  return (
    <div className="flex justify-start">
      <div
        className="flex items-center gap-1.5 px-4 py-3 rounded rounded-bl-none"
        style={{ background: 'var(--brown)' }}
        aria-label="Witness is typing"
        role="status"
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--parchment-dark)' }}
            animate={{ scale: [1, 1.4, 1] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  )
}
