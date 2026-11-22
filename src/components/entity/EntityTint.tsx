'use client'

import { motion } from 'framer-motion'

/** The 11:13 search: the room takes on the entity's colour and flickers now and then. */
export function EntityTint() {
  return (
    <motion.div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{ background: 'radial-gradient(ellipse at center, rgba(143,29,44,0.12), rgba(143,29,44,0.38))', mixBlendMode: 'multiply' }}
      animate={{ opacity: [1, 1, 0.4, 1, 1, 0.7, 1] }}
      transition={{ repeat: Infinity, duration: 7, times: [0, 0.6, 0.62, 0.64, 0.9, 0.92, 1] }}
    />
  )
}
