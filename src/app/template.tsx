'use client'

import { motion } from 'framer-motion'

/**
 * Re-mounts on every navigation, so each room is entered through a short
 * fade from black: moving between places, not loading pages.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <motion.div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 60, background: 'var(--ink)' }}
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}
      />
    </>
  )
}
