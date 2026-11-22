'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'
import { buildNotebook } from '@/lib/case/notebook'
import { CASE_001 } from '@/data/case001'
import { audio } from '@/lib/audio/engine'
import { CLARA_FRAGMENTS } from '@/data/case001/story'

const PAGES = ['Open questions', 'Doesn\u2019t add up', 'Found so far', 'Clara\u2019s last hour'] as const

/** The investigator's notebook: writes itself up from what has been found. */
export function Notebook({ open, onClose }: { open: boolean; onClose: () => void }) {
  const state = useGameStore((s) => s)
  const [page, setPage] = useState(0)
  const [dir, setDir] = useState(1)
  const nb = buildNotebook(state, CASE_001)

  useEffect(() => {
    if (!open) return
    audio.sfx('page')
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') turn(1)
      if (e.key === 'ArrowLeft') turn(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, page])

  const turn = (d: number) => {
    const next = Math.min(PAGES.length - 1, Math.max(0, page + d))
    if (next === page) return
    audio.sfx('page', 0.7)
    setDir(d)
    setPage(next)
  }

  const answered = nb.questions.filter((q) => q.answer).length

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 50, background: 'rgba(14,12,16,0.7)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Investigator's notebook"
            initial={{ y: 60, rotate: -4, opacity: 0 }}
            animate={{ y: 0, rotate: -1, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 24 }}
            className="relative w-full max-w-lg rounded-sm"
            style={{ perspective: 1600, background: 'linear-gradient(160deg, var(--brown), var(--burgundy))', padding: 10, boxShadow: '0 30px 60px rgba(14,12,16,0.7)' }}
          >
            <div className="relative rounded-sm overflow-hidden" style={{ background: 'var(--parchment-light)', minHeight: 440 }}>
              {/* ruled paper and a margin line */}
              <div aria-hidden="true" className="absolute inset-0" style={{ background: 'repeating-linear-gradient(180deg, transparent 0 31px, rgba(81,65,61,0.18) 31px 32px)' }} />
              <div aria-hidden="true" className="absolute top-0 bottom-0 left-10 w-px" style={{ background: 'var(--thread)', opacity: 0.4 }} />

              <div className="relative flex items-center justify-between pl-14 pr-3 pt-4">
                <p className="font-cinzel text-xs tracking-[0.25em] text-brown">CASE 001 · NOTES</p>
                <button onClick={onClose} aria-label="Close the notebook" className="p-1"><X size={16} color="var(--brown)" /></button>
              </div>

              <AnimatePresence mode="wait" custom={dir}>
                <motion.div
                  key={page}
                  custom={dir}
                  initial={{ rotateY: dir > 0 ? 70 : -70, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: dir > 0 ? -70 : 70, opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  style={{ transformOrigin: dir > 0 ? 'left center' : 'right center' }}
                  className="relative pl-14 pr-6 pt-3 pb-16"
                >
                  <h2 className="font-cormorant font-bold text-obsidian text-2xl mb-3">{PAGES[page]}</h2>

                  {page === 0 && (
                    <>
                      <p className="font-inter text-xs text-brown mb-3">{answered} of {nb.questions.length} answered</p>
                      <ul className="space-y-3">
                        {nb.questions.map((q) => (
                          <li key={q.id}>
                            <p className={`font-cormorant text-lg text-obsidian leading-snug ${q.answer ? 'line-through decoration-brown/60' : ''}`}>{q.question}</p>
                            {q.answer
                              ? <p className="font-caveat text-xl leading-snug" style={{ color: 'var(--thread)' }}>{q.answer}</p>
                              : <p className="font-inter text-xs text-brown">Not yet known.</p>}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {page === 1 && (
                    nb.doubts.length === 0 ? (
                      <p className="font-inter text-base text-brown">Nothing contradicts anything yet. Collect statements and evidence, then compare them.</p>
                    ) : (
                      <ul className="space-y-3">
                        {nb.doubts.map((d) => (
                          <li key={d.id} className="flex gap-2">
                            <span aria-hidden="true" className="font-caveat text-xl" style={{ color: d.confirmed ? 'var(--verdigris)' : 'var(--thread)' }}>{d.confirmed ? '\u2713' : '?'}</span>
                            <div>
                              <p className="font-inter text-sm text-obsidian leading-snug">{d.text}</p>
                              <p className="font-inter text-[10px] tracking-wide uppercase text-brown mt-0.5">{d.confirmed ? 'Proven' : 'Not proven yet: confirm it on the board or challenge the witness'}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )
                  )}

                  {page === 3 && (
                    <>
                      <p className="font-inter text-xs text-brown mb-3">{(state.fragments ?? []).length} of {CLARA_FRAGMENTS.length} memories. Watch reflections, windows and doorways: sometimes she is there.</p>
                      <ul className="space-y-3">
                        {CLARA_FRAGMENTS.map((f) => {
                          const got = (state.fragments ?? []).includes(f.id)
                          return (
                            <li key={f.id}>
                              <p className="font-inter text-[10px] tracking-[0.2em] text-brown">{f.time.toUpperCase()}</p>
                              {got ? <p className="font-caveat text-xl text-obsidian leading-snug">{f.text}</p> : <p className="font-inter text-sm text-brown">Not yet found.</p>}
                            </li>
                          )
                        })}
                      </ul>
                    </>
                  )}

                  {page === 2 && (
                    <>
                      <p className="font-inter text-xs text-brown mb-3">{nb.foundCount} items logged. Most recent:</p>
                      <ul className="space-y-2">
                        {nb.recent.map((r) => (
                          <li key={r.id} className="font-cormorant text-lg text-obsidian">{'\u2014'} {r.name}</li>
                        ))}
                        {nb.recent.length === 0 && <li className="font-inter text-sm text-brown">Nothing yet.</li>}
                      </ul>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="absolute bottom-3 left-14 right-4 flex items-center justify-between">
                <button onClick={() => turn(-1)} disabled={page === 0} aria-label="Previous page" className="p-2 disabled:opacity-30"><ChevronLeft size={18} color="var(--brown)" /></button>
                <span className="font-inter text-xs text-brown">{page + 1} / {PAGES.length}</span>
                <button onClick={() => turn(1)} disabled={page === PAGES.length - 1} aria-label="Next page" className="p-2 disabled:opacity-30"><ChevronRight size={18} color="var(--brown)" /></button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
