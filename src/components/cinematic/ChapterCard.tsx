'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui'
import { useHydrated } from '@/store/useHydrated'
import { useGameStore } from '@/store/gameStore'
import { pendingChapterEnd } from '@/store/story'
import { CHAPTERS } from '@/data/case001/story'
import { audio } from '@/lib/audio/engine'

/** When a chapter closes: a cliffhanger, a word from the partner, and the next chapter's title. */
export function ChapterCard() {
  const hydrated = useHydrated()
  const pathname = usePathname()
  const state = useGameStore((s) => s)
  const markCinematicSeen = useGameStore((s) => s.markCinematicSeen)
  const [words, setWords] = useState(0)

  const onCase = pathname.startsWith('/case/001/') && !pathname.startsWith('/case/001/conclusion')
  const ch = hydrated && onCase ? pendingChapterEnd(state) : null
  const next = ch ? CHAPTERS.find((c) => c.number === ch.number + 1) : undefined
  const text = ch?.cliffhanger.split(' ') ?? []

  useEffect(() => {
    if (!ch) return
    setWords(0)
    audio.sfx('drone', 0.6)
    setTimeout(() => audio.sfx('stamp', 0.7), 900)
    const t = setInterval(() => setWords((n) => (n >= text.length ? n : n + 1)), 120)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ch?.id])

  return (
    <AnimatePresence mode="wait">
      {ch && (
        <motion.div
          key={ch.id}
          role="dialog"
          aria-modal="true"
          aria-label={`Chapter ${ch.number} closed`}
          className="fixed inset-0 flex items-center justify-center px-6 overflow-y-auto"
          style={{ zIndex: 60, background: 'rgba(8,7,9,0.96)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8 } }}
        >
          <div className="max-w-2xl w-full text-center space-y-6 py-12">
            <motion.p initial={{ opacity: 0, letterSpacing: '0.8em' }} animate={{ opacity: 1, letterSpacing: '0.35em' }} transition={{ duration: 1.2 }} className="font-cinzel text-xs text-parchment-dark">
              CHAPTER {ch.number} · CLOSED
            </motion.p>
            <motion.h2 initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 180, damping: 18, delay: 0.4 }} className="font-cormorant font-bold text-parchment text-5xl">
              {ch.title}
            </motion.h2>
            <p className="font-cormorant italic text-parchment text-2xl leading-snug min-h-24">{text.slice(0, words).join(' ')}</p>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: words >= text.length ? 1 : 0, y: 0 }} className="flex items-start gap-3 text-left max-w-lg mx-auto rounded-sm p-4" style={{ background: 'rgba(81,65,61,0.35)' }}>
              <span aria-hidden="true" className="w-10 h-10 rounded-full flex items-center justify-center font-cinzel text-sm flex-shrink-0" style={{ background: 'var(--burgundy)', color: 'var(--parchment)', border: '1px solid var(--gold)' }}>R</span>
              <p className="font-inter text-base text-parchment-dark"><span className="text-parchment font-semibold">Archivist Reed: </span>{ch.partner}</p>
            </motion.div>
            {next && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: words >= text.length ? 1 : 0 }} transition={{ delay: 0.6 }} className="font-cinzel text-sm tracking-[0.3em] text-gold">
                NEXT · CHAPTER {next.number}: {next.title.toUpperCase()}
              </motion.p>
            )}
            {!next && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: words >= text.length ? 1 : 0 }} transition={{ delay: 0.6 }} className="font-cinzel text-sm tracking-[0.3em] text-gold">
                NEXT · THE CONFRONTATION
              </motion.p>
            )}
            <Button variant="primary" onClick={() => { audio.sfx('click'); markCinematicSeen(ch.id) }}>Continue</Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
