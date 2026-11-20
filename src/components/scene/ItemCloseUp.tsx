'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { Button, Stamp } from '@/components/ui'
import { ObjectCloseUp } from './CloseUpInteractions'
import { useGameStore } from '@/store/gameStore'
import { useFxStore } from '@/store/fxStore'
import { audio } from '@/lib/audio/engine'
import { CASE_001 } from '@/data/case001'
import type { Evidence, SceneObject } from '@/types'

interface ItemCloseUpProps {
  object: SceneObject | null
  evidence: Evidence[]
  newlyFound: boolean
  onClose: () => void
}

/**
 * Shown after the camera zooms into an object: the item up close, with its own
 * interaction (open, turn over, magnify, play) and any hidden detail to find.
 */
export function ItemCloseUp({ object, evidence, newlyFound, onClose }: ItemCloseUpProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const collected = useGameStore((s) => s.collectedEvidence)
  const collectEvidence = useGameStore((s) => s.collectEvidence)
  const [justFound, setJustFound] = useState<string | null>(null)

  useEffect(() => {
    if (!object) return
    setJustFound(null)
    // Discovery sound: a full sting for key evidence, a chime for the rest
    if (newlyFound) audio.sfx(evidence.some((e) => e.relevance === 'core') ? 'sting' : 'chime')
    else audio.sfx('page', 0.6)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [object])

  // Hidden details are logged as optional evidence (never needed to finish)
  const onFind = (clueId: string, at: { x: number; y: number }) => {
    if (useGameStore.getState().collectedEvidence[clueId]) return
    collectEvidence(clueId)
    audio.sfx('sting', 0.9)
    useFxStore.getState().fly(clueId, at)
    setJustFound(clueId)
  }

  const clue = justFound ? CASE_001.evidence.find((e) => e.id === justFound) : null

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

            <div className="w-full max-w-3xl">
              <ObjectCloseUp
                object={object}
                evidence={evidence}
                found={Object.keys(collected).filter((id) => id.startsWith('OC-'))}
                onFind={onFind}
              />
            </div>

            <AnimatePresence>
              {clue && (
                <motion.div
                  key={clue.id}
                  role="status"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-3 max-w-xl px-4 py-3 rounded border"
                  style={{ borderColor: 'var(--candle)', background: 'rgba(14,12,16,0.85)', boxShadow: '0 0 24px rgba(232,177,93,0.25)' }}
                >
                  <Sparkles size={18} color="var(--candle)" className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-cinzel text-[10px] tracking-[0.25em] text-parchment-dark">HIDDEN DETAIL FOUND</p>
                    <p className="font-cormorant font-bold text-parchment text-lg">{clue.name}</p>
                    <p className="font-inter text-sm text-parchment-dark">{clue.description}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="max-w-xl space-y-2">
              {evidence.map((ev) => (
                <p key={ev.id} className="font-inter text-base text-parchment-dark text-center leading-relaxed">
                  {evidence.length > 1 && <strong className="text-parchment font-semibold">{ev.name}: </strong>}
                  {ev.description}
                </p>
              ))}
            </div>

            <div className="flex flex-col items-center gap-3">
              {newlyFound && (
                <motion.div
                  initial={{ scale: 2.2, opacity: 0, rotate: -14 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ delay: 0.5, type: 'spring', stiffness: 420, damping: 18 }}
                  onAnimationStart={() => setTimeout(() => audio.sfx('stamp', 0.8), 500)}
                >
                  <Stamp label="LOGGED" variant="solved" />
                </motion.div>
              )}
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
