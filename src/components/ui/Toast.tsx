'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'

export interface ToastProps {
  message: string
  variant?: 'info' | 'success' | 'error'
  duration?: number
  onDismiss: () => void
}

export function Toast({
  message,
  variant = 'info',
  duration = 3000,
  onDismiss,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [duration, onDismiss])

  const variantClasses = {
    info:    'border-gold text-parchment',
    success: 'border-verdigris text-parchment',
    error:   'border-thread text-parchment',
  }

  return (
    <AnimatePresence>
      <motion.div
        role="alert"
        aria-live="polite"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.2 }}
        onClick={onDismiss}
        className={clsx(
          'fixed bottom-6 right-6 z-50 cursor-pointer',
          'bg-[var(--ink)] border rounded px-4 py-3 text-sm font-inter',
          'shadow-lg max-w-xs',
          variantClasses[variant]
        )}
      >
        {message}
      </motion.div>
    </AnimatePresence>
  )
}
