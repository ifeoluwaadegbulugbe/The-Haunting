'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, Stamp } from '@/components/ui'
import { EvidenceVisual } from './EvidenceVisual'
import type { Evidence, SceneObject } from '@/types'

interface ItemCloseUpProps {
  object: SceneObject | null
  evidence: Evidence[]
  newlyFound: boolean
  onClose: () => void
}

/**
 * Shown after the camera zooms into an object: the item up close, with
 * what was recovered from it.
 */
export function ItemCloseUp({ object, evidence, newlyFound, onClose }: ItemCloseUpProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!object) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [object, onClose])

  return (
    <AnimatePresence>
      {object && (
        <motion.div
          key={object.id}
          role="dialog"
          aria-modal="true"
          aria-label={`Close-up: ${object.name}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 overflow-y-auto"
          style={{ zIndex: 30, background: 'rgba(14,12,16,0.72)', backdropFilter: 'blur(2px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            initial={{ scale: 0.85, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.05 }}
            className="min-h-full flex flex-col items-center justify-center gap-5 px-4 py-10"
          >
            <header className="text-center max-w-xl">
              <p className="font-cinzel text-xs tracking-[0.3em] text-parchment-dark uppercase">Examining</p>
              <h2 className="font-cormorant font-bold text-parchment text-3xl">{object.name}</h2>
            </header>

            <div className="w-full max-w-3xl space-y-8">
              {evidence.map((ev) => (
                <section key={ev.id} className="space-y-3">
                  <EvidenceVisual evidenceId={ev.id} assetPath={ev.assetPath} name={ev.name} />
                  {evidence.length > 1 && (
                    <p className="font-cormorant font-semibold text-parchment text-lg text-center">{ev.name}</p>
                  )}
                  <p className="font-inter text-base text-parchment-dark text-center max-w-xl mx-auto leading-relaxed">
                    {ev.description}
                  </p>
                </section>
              ))}
            </div>

            <div className="flex flex-col items-center gap-3">
              {newlyFound && <Stamp label="LOGGED" variant="solved" />}
              <Button ref={closeRef} variant="primary" onClick={onClose}>
                Return to the study
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
