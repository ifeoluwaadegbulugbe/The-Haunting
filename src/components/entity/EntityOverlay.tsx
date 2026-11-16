'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface EntityOverlayProps {
  open: boolean
  text?: string
  duration?: number // ms, default 3500
  onDismiss: () => void
}

export function EntityOverlay({
  open,
  text,
  duration = 3500,
  onDismiss,
}: EntityOverlayProps) {
  useEffect(() => {
    if (!open) return
    const t = setTimeout(onDismiss, duration)
    return () => clearTimeout(t)
  }, [open, duration, onDismiss])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          onClick={onDismiss}
          className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
          style={{ background: 'rgba(14,12,16,0.92)' }}
          aria-live="assertive"
          aria-label="Entity message"
          role="dialog"
        >
          {text && (
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="font-caveat text-2xl text-center max-w-sm px-6 leading-relaxed"
              style={{
                color: 'var(--entity-glow)',
                textShadow: '0 0 24px var(--entity)',
              }}
            >
              {text}
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
