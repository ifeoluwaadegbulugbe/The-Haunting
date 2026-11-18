'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone } from 'lucide-react'
import { Button } from '@/components/ui'
import { CASE_001 } from '@/data/case001'

type Stage = 'fade' | 'note' | 'ringing' | 'voicemail' | 'cellar' | 'done'

interface RevealSequenceProps {
  theorySummary?: string
  onComplete:     () => void
}

export function RevealSequence({ theorySummary, onComplete }: RevealSequenceProps) {
  const [stage, setStage] = useState<Stage>('fade')

  // Advance automatically through timed stages
  useEffect(() => {
    if (stage === 'fade') {
      const t = setTimeout(() => setStage('note'), 1800)
      return () => clearTimeout(t)
    }
    if (stage === 'note') {
      const t = setTimeout(() => setStage('ringing'), 3500)
      return () => clearTimeout(t)
    }
    if (stage === 'voicemail') {
      const t = setTimeout(() => setStage('cellar'), 6000)
      return () => clearTimeout(t)
    }
    if (stage === 'cellar') {
      const t = setTimeout(() => { setStage('done'); onComplete() }, 5000)
      return () => clearTimeout(t)
    }
  }, [stage, onComplete])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'var(--ink)' }}
      aria-live="polite"
    >
      <AnimatePresence mode="wait">

        {stage === 'fade' && (
          <motion.div
            key="fade"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="text-center"
          >
            <p className="font-cinzel text-parchment-dark text-sm tracking-widest uppercase">
              Case 001 — Concluding
            </p>
          </motion.div>
        )}

        {stage === 'note' && (
          <motion.div
            key="note"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-sm text-center px-6"
          >
            <p className="font-caveat text-parchment text-xl leading-relaxed">
              {theorySummary
                ? `"${theorySummary}"`
                : '"The truth was in the house all along."'}
            </p>
          </motion.div>
        )}

        {stage === 'ringing' && (
          <motion.div
            key="ringing"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <motion.div
              animate={{ rotate: [-8, 8, -8, 8, 0] }}
              transition={{ repeat: Infinity, duration: 0.6 }}
            >
              <Phone size={48} color="var(--entity-glow)" />
            </motion.div>
            <p className="font-cinzel text-entity-glow text-lg tracking-widest">11:13</p>
            <Button variant="primary" onClick={() => setStage('voicemail')}>
              Answer
            </Button>
          </motion.div>
        )}

        {stage === 'voicemail' && (
          <motion.div
            key="voicemail"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="max-w-sm text-center px-6 space-y-4"
          >
            <p className="font-inter text-xs text-parchment-dark uppercase tracking-widest">
              Voicemail — Clara Ashworth
            </p>
            <p
              className="font-caveat text-xl leading-relaxed"
              style={{ color: 'var(--entity-glow)', textShadow: '0 0 16px var(--entity)' }}
            >
              {CASE_001.truth.finalVoicemail}
            </p>
          </motion.div>
        )}

        {stage === 'cellar' && (
          <motion.div
            key="cellar"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="relative w-full h-full"
          >
            <Image
              src="/assets/ui/cellar-reveal.jpg"
              alt="The cellar at Ashworth House"
              fill
              className="object-cover"
            />
            <div
              className="absolute inset-0"
              style={{ background: 'rgba(14,12,16,0.5)' }}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
